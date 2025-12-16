import express from 'express';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// List conversations for current user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name email avatar')
      .populate({
        path: 'lastMessage',
        select: 'text sender createdAt readBy',
        populate: { path: 'sender', select: 'name' },
      })
      .sort({ updatedAt: -1 });

    // Calculate unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: userId },
          readBy: { $ne: userId },
        });
        return {
          ...conv.toObject(),
          unreadCount,
        };
      })
    );

    res.json({ success: true, conversations: conversationsWithUnread });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or get a 1:1 conversation with another user
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otherUserId } = req.body;
    if (!otherUserId) return res.status(400).json({ message: 'otherUserId is required' });
    if (otherUserId === userId) return res.status(400).json({ message: 'Invalid otherUserId' });

    const other = await User.findById(otherUserId).select('_id');
    if (!other) return res.status(404).json({ message: 'User not found' });

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
      $expr: { $eq: [{ $size: '$participants' }, 2] },
    })
      .populate('participants', 'name email avatar')
      .populate({
        path: 'lastMessage',
        select: 'text sender createdAt',
        populate: { path: 'sender', select: 'name' },
      });

    if (!conversation) {
      conversation = await Conversation.create({ participants: [userId, otherUserId] });
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email avatar')
        .populate({
          path: 'lastMessage',
          select: 'text sender createdAt',
          populate: { path: 'sender', select: 'name' },
        });
    }

    res.json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.participants.map(String).includes(String(userId))) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: 1 })
      .limit(500);

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark messages as read in a conversation
router.post('/conversations/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.participants.map(String).includes(String(userId))) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    // Mark all unread messages in this conversation as read
    await Message.updateMany(
      {
        conversation: conversation._id,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
      }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send message (REST fallback; realtime uses socket but this is handy too)
router.post('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'text is required' });

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.participants.map(String).includes(String(userId))) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: userId,
      text: text.trim(),
      readBy: [userId],
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const populated = await Message.findById(message._id).populate('sender', 'name email avatar');

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;


