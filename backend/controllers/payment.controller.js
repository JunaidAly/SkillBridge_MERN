import safepay, { fetchV1TrackerStatus } from '../config/safepay.js';
import { getPack, listPackages } from '../config/creditPacks.js';
import Transaction from '../models/Transaction.js';
import { CreditTransaction, CreditWallet } from '../models/Credit.js';
import RefundRequest from '../models/RefundRequest.js';

export const getPackages = async (req, res) => {
  res.json({ packages: listPackages() });
};

const VISIBLE_STATUSES = ['completed', 'failed', 'refunded'];
const MAX_PAGE_LIMIT = 50;
const DEFAULT_PAGE_LIMIT = 10;

export const getMyTransactions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_LIMIT));

    const filter = { user: req.user.userId, status: { $in: VISIBLE_STATUSES } };

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(filter)
        .select('creditsGranted amountPaid currency status createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    const transactionIds = transactions.map((t) => t._id);
    const refundRequests = await RefundRequest.find({ transaction: { $in: transactionIds } })
      .select('transaction status')
      .sort({ createdAt: -1 });
    const refundStatusByTransaction = {};
    refundRequests.forEach((r) => {
      // Keep the most recent one per transaction (already sorted desc above)
      if (!(r.transaction.toString() in refundStatusByTransaction)) {
        refundStatusByTransaction[r.transaction.toString()] = r.status;
      }
    });

    res.json({
      transactions: transactions.map((t) => ({
        id: t._id.toString(),
        creditsGranted: t.creditsGranted,
        amountPaid: t.amountPaid,
        currency: t.currency,
        status: t.status,
        createdAt: t.createdAt,
        refundRequestStatus: refundStatusByTransaction[t._id.toString()] || null,
      })),
      page,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Grants credits and marks a transaction completed - shared by the webhook
// handler and the polling fallback below so there's exactly one place that
// moves credits, no matter which path detects the successful payment.
//
// Claims the transaction with an ATOMIC findOneAndUpdate (status: 'pending'
// in the filter) rather than read-then-save. Two concurrent callers for the
// same transaction (e.g. a webhook and a redirect-confirm landing together,
// or a dev-mode double-effect firing this twice) will race on that single
// update - exactly one wins the 'pending' -> 'completed' transition, and the
// loser sees a no-op instead of a Mongoose version conflict / double credit.
async function finalizeCompletedTransaction(transaction, rawPayload, providerTransactionId) {
  const claimed = await Transaction.findOneAndUpdate(
    { _id: transaction._id, status: 'pending' },
    {
      $set: {
        status: 'completed',
        rawPayload,
        ...(providerTransactionId ? { providerTransactionId } : {}),
      },
    },
    { new: true }
  );

  if (!claimed) return; // already completed/failed by a concurrent request

  await CreditTransaction.create({
    user: claimed.user,
    type: 'purchase',
    amount: claimed.creditsGranted,
    description: `Purchased ${claimed.creditsGranted} credits via Safepay`,
    source: 'safepay',
    transactionRef: claimed._id,
  });

  let wallet = await CreditWallet.findOne({ user: claimed.user });
  if (!wallet) {
    wallet = await CreditWallet.create({
      user: claimed.user,
      balance: claimed.creditsGranted,
      totalEarned: claimed.creditsGranted,
      totalSpent: 0,
    });
  } else {
    wallet.balance += claimed.creditsGranted;
    wallet.totalEarned += claimed.creditsGranted;
    await wallet.save();
  }
}

async function finalizeFailedTransaction(transaction, rawPayload) {
  if (transaction.status !== 'pending') return; // don't clobber completed/refunded
  transaction.status = 'failed';
  transaction.rawPayload = rawPayload;
  await transaction.save();
}

// Safepay's v1 redirect does NOT include a `sig` (confirmed live - a real
// completed payment's redirect only carried `order_id` + `tracker`), so
// there's no way to verify the callback locally. Instead we treat the
// tracker as a lookup key and ask Safepay directly what its real status is,
// via the confirmed-working GET /order/v1/{tracker} endpoint. This is the
// single source of truth used by both the redirect-confirm call and the
// polling endpoint below.
async function checkAndFinalizeTracker(transaction) {
  if (transaction.status !== 'pending') return transaction;
  if (!transaction.safepayTrackerToken) return transaction;

  const data = await fetchV1TrackerStatus(transaction.safepayTrackerToken);
  if (!data) return transaction;

  if (data.state === 'TRACKER_ENDED' && data.transaction) {
    await finalizeCompletedTransaction(
      transaction,
      { via: 'v1_tracker_status', data },
      data.transaction.reference || transaction.safepayTrackerToken
    );
    return Transaction.findById(transaction._id);
  }

  if (data.state === 'TRACKER_ENDED' && !data.transaction) {
    // Tracker finished without a successful transaction attached - failed/cancelled.
    await finalizeFailedTransaction(transaction, { via: 'v1_tracker_status', data });
    return Transaction.findById(transaction._id);
  }

  return transaction; // still in progress
}

// Get a single transaction's status - polled by the /credits/success page.
// Actively checks Safepay's real status when still pending, so polling alone
// (even without the redirect-confirm call ever succeeding) can resolve it.
export const getTransactionStatus = async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    if (transaction.status === 'pending') {
      try {
        transaction = await checkAndFinalizeTracker(transaction);
      } catch (error) {
        console.error(`Safepay tracker status check failed for transaction ${transaction._id}:`, error.message);
        // Fall through and report current (still pending) status - the
        // frontend will just keep polling.
      }
    }

    res.json({
      transaction: {
        id: transaction._id.toString(),
        status: transaction.status,
        creditsGranted: transaction.creditsGranted,
        amountPaid: transaction.amountPaid,
        currency: transaction.currency,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Confirms a payment from the params Safepay appends to our redirect_url.
// Safepay's v1 redirect carries only `order_id` + `tracker` - no signature -
// so this can't verify the callback locally. Instead it uses the tracker to
// look up the real, authoritative status via GET /order/v1/{tracker}
// (checkAndFinalizeTracker above), the same confirmed-working call used by
// the polling endpoint. Trying this first just lets a successful payment
// resolve immediately instead of waiting for the next poll tick.
export const confirmFromRedirect = async (req, res) => {
  try {
    const { transactionId, tracker } = req.body;

    let transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    // Already settled - nothing to do (also makes a page refresh safe).
    if (transaction.status !== 'pending') {
      return res.json({ transaction: { id: transaction._id.toString(), status: transaction.status } });
    }

    if (!tracker) {
      console.warn('Safepay redirect confirm: missing tracker, got params:', JSON.stringify(req.body));
      return res.status(400).json({ message: 'Missing tracker from the payment provider redirect.' });
    }

    // Make sure the tracker in the redirect is the one we actually created
    // for this purchase, so a tracker from some other payment can't be used
    // to trigger a status check (and potential finalize) against this one.
    if (transaction.safepayTrackerToken && transaction.safepayTrackerToken !== tracker) {
      console.error(
        `Safepay redirect confirm: tracker mismatch for transaction ${transactionId} ` +
        `(expected ${transaction.safepayTrackerToken}, got ${tracker})`
      );
      return res.status(400).json({ message: 'Payment could not be verified.' });
    }

    transaction = await checkAndFinalizeTracker(transaction);

    res.json({
      transaction: {
        id: transaction._id.toString(),
        status: transaction.status,
        creditsGranted: transaction.creditsGranted,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Safepay's checkout is a hosted redirect, not an overlay - this creates a
// 'pending' Transaction up front (before payment happens) so we have our own
// orderId to hand Safepay and match the webhook back against later.
export const createCheckout = async (req, res) => {
  try {
    const { packId } = req.body;

    if (!packId) {
      return res.status(400).json({ message: 'packId is required' });
    }

    const pack = getPack(packId);
    if (!pack) {
      return res.status(400).json({ message: 'Unknown packId' });
    }

    const transaction = await Transaction.create({
      user: req.user.userId,
      packId,
      amountPaid: pack.amountPKR,
      currency: 'PKR',
      creditsGranted: pack.credits,
      status: 'pending',
    });

    try {
      // v1 tracker (SDK -> /order/v1/init). Payments 2.0's /order/payments/v3/
      // was tried here and its tokens are rejected by the hosted checkout page
      // with "Tracker is in an invalid state" - see config/safepay.js.
      // `amount` is the MAJOR unit (plain rupees), not paisas: sending
      // amountPKR * 100 for a Rs 500 pack produced a real Rs 50,000 charge.
      const { token } = await safepay.payments.create({
        amount: pack.amountPKR,
        currency: 'PKR',
      });

      transaction.safepayTrackerToken = token;
      await transaction.save();

      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

      // checkout.create() is synchronous and returns the URL string directly
      // (not wrapped in an object) - confirmed against the installed SDK source.
      //
      // redirectUrl deliberately carries NO query string of its own. Safepay
      // appends its own callback params (order_id, tracker, sig) by simple
      // concatenation - if our URL already had a `?...`, theirs lands as a
      // second `?` instead of `&`, producing a malformed URL where
      // `transactionId` and their `order_id` run together into one garbled
      // value (confirmed live: "<id>?order_id=<id>"). Since `order_id` is
      // just an echo of the `orderId` we pass below (our own transaction id),
      // the frontend reads THAT instead of needing a query param of its own.
      const checkoutUrl = safepay.checkout.create({
        token,
        orderId: transaction._id.toString(),
        cancelUrl: `${frontendUrl}/credits/cancelled`,
        redirectUrl: `${frontendUrl}/credits/success`,
        source: 'custom',
        webhooks: true,
      });

      res.json({
        success: true,
        checkoutUrl,
        transactionId: transaction._id.toString(),
      });
    } catch (safepayError) {
      // Don't leave this Transaction stuck in 'pending' forever - the
      // checkout page was never even shown to the user, so this is a clean
      // failure, not an unresolved payment.
      console.error('Safepay checkout creation failed:', safepayError.response?.data || safepayError.message);
      transaction.status = 'failed';
      transaction.rawPayload = safepayError.response?.data || { message: safepayError.message };
      await transaction.save();
      return res.status(502).json({
        message: 'Unable to start checkout with our payment provider right now. Please try again shortly or contact support.',
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Best-effort - webhooks are not the primary confirmation path (the redirect
// confirm + polling above, both backed by the confirmed-working GET
// /order/v1/{tracker} lookup, are). This just uses the webhook as an early
// trigger: whatever tracker token it names, re-check that tracker's real
// status via the same source of truth rather than trusting the webhook
// payload's own shape (which hasn't been confirmed against the v1 flow).
export const handleWebhook = async (req, res) => {
  try {
    const payload = req.body?.data || req.body || {};
    const trackerToken = payload.token || payload.tracker || req.body?.tracker;

    if (!trackerToken) {
      console.error('Safepay webhook: no tracker token in payload', JSON.stringify(req.body));
      return res.status(200).json({ received: true, message: 'No tracker token in payload' });
    }

    const transaction = await Transaction.findOne({ safepayTrackerToken: trackerToken });
    if (!transaction) {
      console.error(`Safepay webhook: no Transaction found for tracker ${trackerToken}`);
      return res.status(200).json({ received: true, message: 'Unknown tracker token' });
    }

    await checkAndFinalizeTracker(transaction);

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing Safepay webhook:', error);
    return res.status(500).json({ received: false, message: 'Internal error processing webhook' });
  }
};

export const requestRefund = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({ message: 'reason is required' });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    if (transaction.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed transactions can be refunded' });
    }

    const existing = await RefundRequest.findOne({
      transaction: transaction._id,
      status: { $in: ['pending', 'approved'] },
    });
    if (existing) {
      return res.status(400).json({ message: `A refund request already exists for this transaction (${existing.status}).` });
    }

    const refundRequest = await RefundRequest.create({
      user: req.user.userId,
      transaction: transaction._id,
      reason: reason.trim(),
    });

    res.status(201).json({
      refundRequest: {
        id: refundRequest._id.toString(),
        status: refundRequest.status,
        reason: refundRequest.reason,
        createdAt: refundRequest.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
