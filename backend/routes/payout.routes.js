import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requestPayout, getMyPayoutRequests } from '../controllers/payout.controller.js';

const router = express.Router();

router.post('/request', authenticateToken, requestPayout);
router.get('/my-requests', authenticateToken, getMyPayoutRequests);

export default router;
