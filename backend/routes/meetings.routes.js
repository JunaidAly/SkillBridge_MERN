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

// List meetings for current user (upcoming first)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const meetings = await Meeting.find({ participants: userId })
      .populate('participants', 'name email avatar')
      .sort({ startsAt: 1 })
      .limit(200);
    res.json({ success: true, meetings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create meeting (Jitsi link) for a conversation + participant
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { conversationId, otherUserId, title, startsAt } = req.body;

    if (!otherUserId) return res.status(400).json({ message: 'otherUserId is required' });
    if (!title?.trim()) return res.status(400).json({ message: 'title is required' });
    if (!startsAt) return res.status(400).json({ message: 'startsAt is required' });

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
      conversation: convId || null,
      provider: 'jitsi',
      roomName,
      joinUrl,
    });

    const populated = await Meeting.findById(meeting._id).populate('participants', 'name email avatar');
    res.status(201).json({ success: true, meeting: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;


