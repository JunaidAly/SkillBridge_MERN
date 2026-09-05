import express from 'express';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { notifyUser } from '../utils/notify.js';
import { uploadChatAttachment } from '../config/cloudinary.js';
import { isBlockedBetween } from '../utils/blocking.js';
import { isUserOnline } from '../utils/presence.js';

const router = express.Router();

// List conversations for current user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name email avatar lastSeen')
      .populate({
        path: 'lastMessage',
        select: 'text sender createdAt readBy messageType metadata',
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

    if (await isBlockedBetween(userId, otherUserId)) {
      return res.status(403).json({ message: 'Unable to message this user' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
      $expr: { $eq: [{ $size: '$participants' }, 2] },
    })
      .populate('participants', 'name email avatar lastSeen')
      .populate({
        path: 'lastMessage',
        select: 'text sender createdAt',
        populate: { path: 'sender', select: 'name' },
      });

    if (!conversation) {
      conversation = await Conversation.create({ participants: [userId, otherUserId] });
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email avatar lastSeen')
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
    const result = await Message.updateMany(
      {
        conversation: conversation._id,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId, deliveredTo: userId },
      }
    );

    if (result.modifiedCount > 0) {
      const io = req.app.get('io');
      if (io) {
        io.to(`conv:${conversation._id}`).emit('messagesRead', {
          conversationId: String(conversation._id),
          readerId: String(userId),
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a conversation
router.delete('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.participants.map(String).includes(String(userId))) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversation: conversation._id });
    // Delete the conversation itself
    await Conversation.findByIdAndDelete(conversation._id);

    res.json({ success: true, message: 'Conversation deleted' });
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

    const otherParticipantId = conversation.participants.map(String).find((p) => p !== String(userId));
    if (otherParticipantId && (await isBlockedBetween(userId, otherParticipantId))) {
      return res.status(403).json({ message: 'Unable to message this user' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: userId,
      text: text.trim(),
      readBy: [userId],
      deliveredTo: otherParticipantId && isUserOnline(otherParticipantId) ? [otherParticipantId] : [],
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const populated = await Message.findById(message._id).populate('sender', 'name email avatar');

    const io = req.app.get('io');
    if (io) {
      io.to(`conv:${conversation._id}`).emit('newMessage', { message: populated });
    }

    const recipients = conversation.participants.map(String).filter((p) => p !== String(userId));
    for (const recipientId of recipients) {
      notifyUser({
        userId: recipientId,
        type: 'new_message',
        title: `New message from ${populated.sender.name}`,
        body: populated.text.length > 140 ? `${populated.text.slice(0, 140)}...` : populated.text,
        link: '/chat',
      });
    }

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send a file attachment (image or document) - WhatsApp-style chat attachments.
router.post('/conversations/:id/attachments', authenticateToken, uploadChatAttachment.single('file'), async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!req.file) return res.status(400).json({ message: 'file is required' });

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.participants.map(String).includes(String(userId))) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const otherParticipantId = conversation.participants.map(String).find((p) => p !== String(userId));
    if (otherParticipantId && (await isBlockedBetween(userId, otherParticipantId))) {
      return res.status(403).json({ message: 'Unable to message this user' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: userId,
      messageType: 'attachment',
      metadata: {
        url: req.file.path,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      },
      readBy: [userId],
      deliveredTo: otherParticipantId && isUserOnline(otherParticipantId) ? [otherParticipantId] : [],
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const populated = await Message.findById(message._id).populate('sender', 'name email avatar');

    const io = req.app.get('io');
    if (io) {
      io.to(`conv:${conversation._id}`).emit('newMessage', { message: populated });
    }

    const recipients = conversation.participants.map(String).filter((p) => p !== String(userId));
    for (const recipientId of recipients) {
      notifyUser({
        userId: recipientId,
        type: 'new_message',
        title: `New attachment from ${populated.sender.name}`,
        body: req.file.originalname,
        link: '/chat',
      });
    }

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;


