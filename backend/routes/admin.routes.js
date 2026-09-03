import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import {
  getAllTransactions,
  getAllUsers,
  updateUserRole,
  getAnalytics,
  getAuditLog,
  getVerifications,
  reviewVerification,
  getRefundRequests,
  reviewRefundRequest,
} from '../controllers/admin.controller.js';

const router = express.Router();

router.get('/transactions', authenticateToken, requireAdmin, getAllTransactions);
router.get('/analytics', authenticateToken, requireAdmin, getAnalytics);
router.get('/users', authenticateToken, requireAdmin, getAllUsers);
router.patch('/users/:userId/role', authenticateToken, requireAdmin, updateUserRole);
router.get('/audit-log', authenticateToken, requireAdmin, getAuditLog);
router.get('/verifications', authenticateToken, requireAdmin, getVerifications);
router.patch('/verifications/:userId', authenticateToken, requireAdmin, reviewVerification);
router.get('/refund-requests', authenticateToken, requireAdmin, getRefundRequests);
router.patch('/refund-requests/:id', authenticateToken, requireAdmin, reviewRefundRequest);

export default router;
