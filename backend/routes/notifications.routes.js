import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
} from '../controllers/notification.controller.js';

const router = express.Router();

router.get('/', authenticateToken, getNotifications);
router.patch('/read-all', authenticateToken, markAllNotificationsRead);
router.delete('/', authenticateToken, clearAllNotifications);
router.patch('/:id/read', authenticateToken, markNotificationRead);

export default router;
