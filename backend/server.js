import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import chatRoutes from './routes/chat.routes.js';
import meetingsRoutes from './routes/meetings.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'SkillBridge API is running!' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/feedback', feedbackRoutes);

// Socket auth
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization || '').split(' ')[1];

    if (!token) return next(new Error('Access token required'));

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return next(new Error('Invalid or expired token'));
      socket.user = user;
      next();
    });
  } catch (e) {
    next(new Error('Socket auth failed'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user?.userId;

  socket.on('joinConversation', async ({ conversationId }) => {
    if (!conversationId) return;
    const conv = await Conversation.findById(conversationId).select('participants');
    if (!conv) return;
    if (!conv.participants.map(String).includes(String(userId))) return;
    socket.join(`conv:${conversationId}`);
  });

  socket.on('sendMessage', async ({ conversationId, text }, ack) => {
    try {
      if (!conversationId || !text?.trim()) return;
      const conv = await Conversation.findById(conversationId);
      if (!conv) return;
      if (!conv.participants.map(String).includes(String(userId))) return;

      const message = await Message.create({
        conversation: conversationId,
        sender: userId,
        text: text.trim(),
        readBy: [userId],
      });
      conv.lastMessage = message._id;
      await conv.save();

      const populated = await Message.findById(message._id).populate('sender', 'name email avatar');
      io.to(`conv:${conversationId}`).emit('newMessage', { message: populated });
      if (ack) ack({ ok: true, message: populated });
    } catch (err) {
      if (ack) ack({ ok: false, error: err.message });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

