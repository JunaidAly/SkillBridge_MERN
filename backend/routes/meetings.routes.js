import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import Meeting from '../models/Meeting.js';
import User from '../models/User.js';

const router = express.Router();

function makeJitsiRoomName({ conversationId, startsAt }) {
  const ts = startsAt ? new Date(startsAt).getTime() : Date.now();
  return `skillbridge-${conversationId || 'general'}-${ts}`.replace(/[^a-zA-Z0-9-_]/g, '');
}

// Helper: Clean up expired meetings (mark as completed if past end time)
async function cleanupExpiredMeetings(userId) {
  const now = new Date();

  // Find scheduled meetings that have ended (startsAt + duration has passed)
  const expiredMeetings = await Meeting.find({
    participants: userId,
    status: 'scheduled',
  });

  for (const meeting of expiredMeetings) {
    const endTime = new Date(meeting.startsAt.getTime() + (meeting.duration || 60) * 60 * 1000);
    if (now > endTime) {
      meeting.status = 'completed';
      await meeting.save();

      // Update user stats for completed meetings
      await updateUserStatsForMeeting(meeting);
    }
  }
}

// Helper: Update user stats when meeting is completed
async function updateUserStatsForMeeting(meeting) {
  if (!meeting.skill) return;

  const teacherId = meeting.sessionType === 'teaching' ? meeting.createdBy :
    meeting.participants.find(p => String(p) !== String(meeting.createdBy));
  const learnerId = meeting.sessionType === 'learning' ? meeting.createdBy :
    meeting.participants.find(p => String(p) !== String(meeting.createdBy));

  // Update teacher's skill sessions count and overall stats
  if (teacherId) {
    const teacher = await User.findById(teacherId);
    if (teacher) {
      // Update skillsTeaching sessions count
      const skillIndex = teacher.skillsTeaching.findIndex(
        s => s.name.toLowerCase() === meeting.skill.toLowerCase()
      );
      if (skillIndex >= 0) {
        teacher.skillsTeaching[skillIndex].sessions += 1;
      }
      // Update overall stats
      teacher.stats.sessionsTaught = (teacher.stats.sessionsTaught || 0) + 1;
      await teacher.save();
    }
  }

  // Update learner's stats
  if (learnerId) {
    const learner = await User.findById(learnerId);
    if (learner) {
      learner.stats.sessionsLearned = (learner.stats.sessionsLearned || 0) + 1;
      await learner.save();
    }
  }
}

// List meetings for current user (upcoming first, auto-cleanup expired)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Clean up expired meetings
    await cleanupExpiredMeetings(userId);

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

    const other = await User.findById(otherUserId).select('_id');
    if (!other) return res.status(404).json({ message: 'User not found' });

    let convId = conversationId;
    if (convId) {
      const conv = await Conversation.findById(convId);
      if (!conv) return res.status(404).json({ message: 'Conversation not found' });
      if (!conv.participants.map(String).includes(String(userId))) {
        return res.status(403).json({ message: 'Not allowed' });
      }
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

    // Determine who the learner is
    const learnerId = meeting.sessionType === 'learning' ? meeting.createdBy :
      meeting.participants.find(p => String(p) !== String(meeting.createdBy));

    // Only the learner can rate
    if (String(userId) !== String(learnerId)) {
      return res.status(403).json({ message: 'Only the learner can rate the session' });
    }

    meeting.rating = rating;
    await meeting.save();

    // Update teacher's skill rating
    if (meeting.skill) {
      const teacherId = meeting.sessionType === 'teaching' ? meeting.createdBy :
        meeting.participants.find(p => String(p) !== String(meeting.createdBy));

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

// Cancel a meeting
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
    await meeting.save();

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


