import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import Meeting from '../models/Meeting.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { sendMeetingInviteEmail } from '../utils/emailService.js';
import { generateJaasToken } from '../utils/jaasToken.js';
import { notifyUser } from '../utils/notify.js';
import { getSessionRoles, completeExpiredMeetings } from '../utils/meetingCompletion.js';

const router = express.Router();

function makeJitsiRoomName({ conversationId, startsAt }) {
  const ts = startsAt ? new Date(startsAt).getTime() : Date.now();
  return `skillbridge-${conversationId || 'general'}-${ts}`.replace(/[^a-zA-Z0-9-_]/g, '');
}

// List meetings for current user (upcoming first, auto-cleanup expired)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Complete any meetings whose time has passed (also runs on a schedule -
    // see jobs/completeMeetings.js - this is just a fast-path for the caller).
    await completeExpiredMeetings();

    // Only return scheduled (upcoming) meetings
    const meetings = await Meeting.find({
      participants: userId,
      status: 'scheduled',
    })
      .populate('participants', 'name email avatar')
      .sort({ startsAt: 1 })
      .limit(200);
    res.json({ success: true, meetings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all meetings including completed (for history)
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, limit = 50 } = req.query;

    const filter = { participants: userId };
    if (status) filter.status = status;

    const meetings = await Meeting.find(filter)
      .populate('participants', 'name email avatar')
      .sort({ startsAt: -1 })
      .limit(Number(limit));
    res.json({ success: true, meetings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single meeting's details (used to join the in-app video call)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const meeting = await Meeting.findById(req.params.id).populate('participants', 'name email avatar');

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const requester = meeting.participants.find((p) => String(p._id) === String(userId));
    if (!requester) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    // JaaS room names are namespaced under the App ID: "<AppID>/<room>". Prepend it
    // here rather than storing it, since the App ID is an app-wide constant, not
    // per-meeting data.
    const videoRoomName = `${process.env.JAAS_APP_ID}/${meeting.roomName}`;
    const isModerator = String(meeting.createdBy) === String(userId);

    let jaasToken;
    try {
      jaasToken = generateJaasToken({
        userId: String(requester._id),
        name: requester.name,
        email: requester.email,
        isModerator,
      });
    } catch (tokenError) {
      console.error('Failed to generate JaaS token:', tokenError.message);
      return res.status(500).json({ message: 'Unable to generate video call token' });
    }

    res.json({ success: true, meeting, videoRoomName, jaasToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create meeting (Jitsi link) for a conversation + participant
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { conversationId, otherUserId, title, startsAt, sessionType, skill, duration } = req.body;

    if (!otherUserId) return res.status(400).json({ message: 'otherUserId is required' });
    if (!title?.trim()) return res.status(400).json({ message: 'title is required' });
    if (!startsAt) return res.status(400).json({ message: 'startsAt is required' });
    if (!sessionType || !['teaching', 'learning'].includes(sessionType)) {
      return res.status(400).json({ message: 'sessionType must be "teaching" or "learning"' });
    }

    const other = await User.findById(otherUserId).select('_id name');
    if (!other) return res.status(404).json({ message: 'User not found' });

    let convId = conversationId;
    if (convId) {
      const conv = await Conversation.findById(convId);
      if (!conv) return res.status(404).json({ message: 'Conversation not found' });
      if (!conv.participants.map(String).includes(String(userId))) {
        return res.status(403).json({ message: 'Not allowed' });
      }
    }

    // Prevent double-booking: neither party may already have another
    // scheduled session whose time range overlaps this one.
    const proposedStart = new Date(startsAt).getTime();
    const proposedEnd = proposedStart + (duration || 60) * 60 * 1000;
    const candidateMeetings = await Meeting.find({
      status: 'scheduled',
      participants: { $in: [userId, otherUserId] },
    });
    const conflict = candidateMeetings.find((m) => {
      const existStart = m.startsAt.getTime();
      const existEnd = existStart + (m.duration || 60) * 60 * 1000;
      return proposedStart < existEnd && existStart < proposedEnd;
    });
    if (conflict) {
      const conflictIsCurrentUser = conflict.participants.map(String).includes(String(userId));
      return res.status(409).json({
        message: conflictIsCurrentUser
          ? 'You already have a session scheduled that overlaps this time slot.'
          : `${other.name} already has a session scheduled that overlaps this time slot.`,
      });
    }

    const roomName = makeJitsiRoomName({ conversationId: convId, startsAt });
    const joinUrl = `https://meet.jit.si/${roomName}`;

    const meeting = await Meeting.create({
      createdBy: userId,
      participants: [userId, otherUserId],
      title: title.trim(),
      startsAt: new Date(startsAt),
      duration: duration || 60,
      conversation: convId || null,
      provider: 'jitsi',
      roomName,
      joinUrl,
      sessionType,
      skill: skill?.trim() || null,
      status: 'scheduled',
    });

    const populated = await Meeting.findById(meeting._id).populate('participants', 'name email avatar');

    // Send meeting link message in chat if conversation exists
    if (convId) {
      const meetingDate = new Date(startsAt).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const meetingMessage = `📅 Meeting Scheduled!\n\n` +
        `📌 ${title.trim()}\n` +
        `🕐 ${meetingDate}\n` +
        `⏱️ Duration: ${duration || 60} minutes\n` +
        `${skill ? `📚 Skill: ${skill}\n` : ''}` +
        `\n🔗 Join Meeting: ${joinUrl}`;

      const message = await Message.create({
        conversation: convId,
        sender: userId,
        text: meetingMessage,
        readBy: [userId],
        messageType: 'meeting_invite',
        metadata: {
          meetingId: meeting._id,
          joinUrl,
          startsAt: new Date(startsAt),
        },
      });

      // Update conversation's last message
      await Conversation.findByIdAndUpdate(convId, { lastMessage: message._id });

      // Emit socket event for real-time update (will be picked up by connected clients)
      const io = req.app.get('io');
      if (io) {
        const populatedMessage = await Message.findById(message._id).populate('sender', 'name email avatar');
        io.to(`conv:${convId}`).emit('newMessage', { message: populatedMessage });
      }
    }

    // Send email notification to the other participant
    const creator = await User.findById(userId).select('name email');
    const otherUser = await User.findById(otherUserId).select('name email');

    if (otherUser?.email && creator?.name) {
      const meetingDetails = {
        title: title.trim(),
        startsAt: new Date(startsAt),
        duration: duration || 60,
        skill: skill?.trim() || null,
        joinUrl,
        organizerName: creator.name,
      };

      // Send email asynchronously (don't wait for it)
      sendMeetingInviteEmail(otherUser.email, otherUser.name, meetingDetails)
        .catch(err => console.error('Failed to send meeting email:', err));
    }

    if (creator?.name) {
      notifyUser({
        userId: otherUserId,
        type: 'meeting_confirmed',
        title: `${creator.name} scheduled a session with you`,
        body: `${title.trim()} - ${new Date(startsAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`,
        link: `/meetings/${meeting._id}/call`,
      });
    }

    res.status(201).json({ success: true, meeting: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rate a completed meeting (learner rates the teacher)
router.post('/:id/rate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (!meeting.participants.map(String).includes(String(userId))) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    if (meeting.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed meetings' });
    }

    if (meeting.rating) {
      return res.status(400).json({ message: 'Meeting already rated' });
    }

    const { teacherId, learnerId } = getSessionRoles(meeting);

    // Only the learner can rate
    if (String(userId) !== String(learnerId)) {
      return res.status(403).json({ message: 'Only the learner can rate the session' });
    }

    meeting.rating = rating;
    await meeting.save();

    // Update teacher's skill rating
    if (meeting.skill) {
      const teacher = await User.findById(teacherId);
      if (teacher) {
        const skillIndex = teacher.skillsTeaching.findIndex(
          s => s.name.toLowerCase() === meeting.skill.toLowerCase()
        );
        if (skillIndex >= 0) {
          const skill = teacher.skillsTeaching[skillIndex];
          // Calculate new average rating
          const totalSessions = skill.sessions || 1;
          const currentRating = skill.rating || 0;
          const newRating = ((currentRating * (totalSessions - 1)) + rating) / totalSessions;
          teacher.skillsTeaching[skillIndex].rating = Math.round(newRating * 10) / 10;

          // Update overall average rating
          const allRatings = teacher.skillsTeaching
            .filter(s => s.rating > 0)
            .map(s => s.rating);
          if (allRatings.length > 0) {
            teacher.stats.avgRating = Math.round(
              (allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10
            ) / 10;
          }

          await teacher.save();
        }
      }
    }

    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel a meeting. Credits only ever move once a session completes (see
// utils/meetingCompletion.js), never at booking time, so a cancelled meeting -
// which by definition never reaches 'completed' - was never charged for in
// the first place. There is nothing to refund or reverse here.
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (!meeting.participants.map(String).includes(String(userId))) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    if (meeting.status !== 'scheduled') {
      return res.status(400).json({ message: 'Can only cancel scheduled meetings' });
    }

    meeting.status = 'cancelled';
    meeting.cancelledBy = userId;
    meeting.cancelledAt = new Date();
    await meeting.save();

    const { teacherId, learnerId } = getSessionRoles(meeting);
    const canceller = await User.findById(userId).select('name');

    for (const recipientId of [teacherId, learnerId]) {
      if (!recipientId) continue;
      notifyUser({
        userId: recipientId,
        type: 'meeting_cancelled',
        title: `${canceller?.name || 'A participant'} cancelled "${meeting.title}"`,
        body: 'No credits were charged for this session.',
        link: '/chat',
      });
    }

    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a meeting (only creator can delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (String(meeting.createdBy) !== String(userId)) {
      return res.status(403).json({ message: 'Only the creator can delete the meeting' });
    }

    await Meeting.findByIdAndDelete(meeting._id);
    res.json({ success: true, message: 'Meeting deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;


