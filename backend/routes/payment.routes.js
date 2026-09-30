import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createCheckout,
  handleWebhook,
  getPackages,
  getMyTransactions,
  getTransactionStatus,
  confirmFromRedirect,
  requestRefund,
} from '../controllers/payment.controller.js';

const router = express.Router();

// Public - lets the frontend list packages without hardcoding pack ids/amounts.
router.get('/packages', getPackages);

// Public - called by Safepay, not a logged-in user. Its signature is an HMAC
// over the RAW body, so server.js mounts express.raw() for this exact path
// ahead of the global JSON parser; req.body arrives here as a Buffer.
router.post('/safepay-webhook', handleWebhook);

// JWT-protected
router.post('/checkout', authenticateToken, createCheckout);
router.post('/confirm', authenticateToken, confirmFromRedirect);
router.get('/transactions', authenticateToken, getMyTransactions);
router.get('/transactions/:transactionId', authenticateToken, getTransactionStatus);
router.post('/transactions/:transactionId/refund-request', authenticateToken, requestRefund);

export default router;
