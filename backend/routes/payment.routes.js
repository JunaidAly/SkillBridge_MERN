import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { createCheckout, handleWebhook, getPackages, getMyTransactions, requestRefund } from '../controllers/payment.controller.js';

const router = express.Router();

// Public - lets the frontend list packages without hardcoding price IDs/amounts.
router.get('/packages', getPackages);

// Public - called by Paddle, not a logged-in user. Raw body parsing is applied in server.js.
router.post('/webhook', handleWebhook);

// JWT-protected
router.post('/checkout', authenticateToken, createCheckout);
router.get('/transactions', authenticateToken, getMyTransactions);
router.post('/transactions/:transactionId/refund-request', authenticateToken, requestRefund);

export default router;
