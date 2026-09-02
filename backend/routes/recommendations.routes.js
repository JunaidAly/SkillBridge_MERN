import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import {
  getMyRecommendations,
  trainModels,
  checkServiceHealth
} from '../controllers/recommendations.controller.js';

const router = express.Router();

/**
 * @route   GET /api/recommendations/me
 * @desc    Get AI recommendations for current student
 * @access  Private (Student)
 */
router.get('/me', authenticateToken, getMyRecommendations);

/**
 * @route   POST /api/recommendations/train
 * @desc    Trigger model training (Admin only)
 * @access  Private (Admin)
 */
router.post('/train', authenticateToken, requireAdmin, trainModels);

/**
 * @route   GET /api/recommendations/health
 * @desc    Check recommendation service health
 * @access  Private
 */
router.get('/health', authenticateToken, checkServiceHealth);

export default router;
