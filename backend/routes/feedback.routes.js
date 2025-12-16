import express from 'express';
import Feedback from '../models/Feedback.js';
import Meeting from '../models/Meeting.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get feedback received by current user
router.get('/received', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const feedbacks = await Feedback.find({ toUser: userId })
      .populate('fromUser', 'name email avatar')
      .populate('meeting', 'title startsAt')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      feedbacks: feedbacks.map((f) => ({
        id: f._id,
        name: f.fromUser?.name || 'Unknown',
        avatar: f.fromUser?.avatar || null,
        type: 'Rated you',
        rating: f.rating,
        date: f.createdAt.toISOString().split('T')[0],
        comment: f.comment,
        skill: f.skill,
        meetingId: f.meeting?._id || null,
        meetingTitle: f.meeting?.title || null,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get feedback given by current user
router.get('/given', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const feedbacks = await Feedback.find({ fromUser: userId })
      .populate('toUser', 'name email avatar')
      .populate('meeting', 'title startsAt')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      feedbacks: feedbacks.map((f) => ({
        id: f._id,
        name: f.toUser?.name || 'Unknown',
        avatar: f.toUser?.avatar || null,
        type: 'You rated',
        rating: f.rating,
        date: f.createdAt.toISOString().split('T')[0],
        comment: f.comment,
        skill: f.skill,
        meetingId: f.meeting?._id || null,
        meetingTitle: f.meeting?.title || null,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get pending sessions (meetings that have passed and don't have feedback yet)
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();

    // Get meetings where user is a participant and meeting has passed
    const pastMeetings = await Meeting.find({
      participants: userId,
      startsAt: { $lt: now },
    })
      .populate('participants', 'name email avatar')
      .sort({ startsAt: -1 })
      .limit(50);

    // Get feedback already given by this user
    const givenFeedback = await Feedback.find({ fromUser: userId }).select('meeting');
    const feedbackMeetingIds = new Set(givenFeedback.map((f) => String(f.meeting)));

    // Filter out meetings that already have feedback
    const pending = pastMeetings
      .filter((m) => !feedbackMeetingIds.has(String(m._id)))
      .map((m) => {
        const other = m.participants.find((p) => String(p._id) !== String(userId));
        return {
          meetingId: m._id,
          person: other?.name || 'Unknown',
          avatar: other?.avatar || null,
          skill: m.title,
          date: m.startsAt.toISOString().split('T')[0],
          otherUserId: other?._id || null,
        };
      });

    res.json({ success: true, pending });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit feedback
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { toUserId, meetingId, skill, rating, comment } = req.body;

    if (!toUserId) return res.status(400).json({ message: 'toUserId is required' });
    if (!skill?.trim()) return res.status(400).json({ message: 'skill is required' });
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'rating must be between 1 and 5' });
    }

    // Verify toUser exists
    const toUser = await User.findById(toUserId).select('_id');
    if (!toUser) return res.status(404).json({ message: 'User not found' });

    // If meetingId provided, verify it exists and user is a participant
    let meeting = null;
    if (meetingId) {
      meeting = await Meeting.findById(meetingId);
      if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
      if (!meeting.participants.map(String).includes(String(userId))) {
        return res.status(403).json({ message: 'Not allowed' });
      }
      if (!meeting.participants.map(String).includes(String(toUserId))) {
        return res.status(400).json({ message: 'User is not a participant in this meeting' });
      }

      // Check if feedback already exists for this meeting
      const existing = await Feedback.findOne({
        fromUser: userId,
        toUser: toUserId,
        meeting: meetingId,
      });
      if (existing) {
        return res.status(400).json({ message: 'Feedback already submitted for this meeting' });
      }
    }

    // Create feedback
    const feedback = await Feedback.create({
      fromUser: userId,
      toUser: toUserId,
      meeting: meetingId || null,
      skill: skill.trim(),
      rating,
      comment: comment?.trim() || '',
    });

    // Update user stats (average rating, sessions taught/learned)
    await updateUserStats(toUserId);

    const populated = await Feedback.findById(feedback._id)
      .populate('fromUser', 'name email avatar')
      .populate('toUser', 'name email avatar')
      .populate('meeting', 'title startsAt');

    res.status(201).json({ success: true, feedback: populated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Feedback already submitted for this meeting' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Helper function to update user stats
async function updateUserStats(userId) {
  try {
    const feedbacks = await Feedback.find({ toUser: userId });
    const ratings = feedbacks.map((f) => f.rating);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    // Count unique meetings as sessions
    const uniqueMeetings = new Set(feedbacks.filter((f) => f.meeting).map((f) => String(f.meeting)));
    const sessionsTaught = uniqueMeetings.size;

    await User.findByIdAndUpdate(userId, {
      'stats.avgRating': Math.round(avgRating * 10) / 10,
      'stats.sessionsTaught': sessionsTaught,
    });
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

export default router;

