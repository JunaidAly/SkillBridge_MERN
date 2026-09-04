import PayoutRequest from '../models/PayoutRequest.js';
import { CreditTransaction, CreditWallet } from '../models/Credit.js';
import { creditsToRupees } from '../config/creditConversion.js';

// Below this, admin would have to manually process a payout request over a
// negligible amount - not worth the manual bank-transfer overhead.
const MIN_PAYOUT_CREDITS = 100;

const PAYOUT_METHODS = ['bank_transfer', 'jazzcash', 'easypaisa'];

const MAX_PAGE_LIMIT = 50;
const DEFAULT_PAGE_LIMIT = 10;

export const requestPayout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { creditsRequested, payoutMethod, payoutDetails } = req.body;

    const credits = Number(creditsRequested);
    if (!Number.isFinite(credits) || credits < MIN_PAYOUT_CREDITS) {
      return res.status(400).json({
        message: `Minimum payout request is ${MIN_PAYOUT_CREDITS} credits.`,
      });
    }

    if (!PAYOUT_METHODS.includes(payoutMethod)) {
      return res.status(400).json({ message: `payoutMethod must be one of: ${PAYOUT_METHODS.join(', ')}` });
    }

    if (!payoutDetails?.accountTitle?.trim() || !payoutDetails?.accountNumber?.trim()) {
      return res.status(400).json({ message: 'accountTitle and accountNumber are required' });
    }
    if (payoutMethod === 'bank_transfer' && !payoutDetails?.bankName?.trim()) {
      return res.status(400).json({ message: 'bankName is required for bank_transfer' });
    }

    const existing = await PayoutRequest.findOne({
      teacher: userId,
      status: { $in: ['pending', 'approved'] },
    });
    if (existing) {
      return res.status(400).json({
        message: `You already have a payout request in progress (${existing.status}). Wait for it to be resolved before requesting another.`,
      });
    }

    const wallet = await CreditWallet.findOne({ user: userId });
    if (!wallet || wallet.balance < credits) {
      return res.status(400).json({
        message: `Insufficient balance. You have ${wallet?.balance || 0} credits, requested ${credits}.`,
      });
    }

    // Hold pattern: deduct immediately so the same credits can't be spent or
    // requested again while the payout is pending review.
    wallet.balance -= credits;
    wallet.totalSpent += credits;
    await wallet.save();

    const payoutRequest = await PayoutRequest.create({
      teacher: userId,
      creditsRequested: credits,
      amountPKR: creditsToRupees(credits),
      payoutMethod,
      payoutDetails: {
        accountTitle: payoutDetails.accountTitle.trim(),
        accountNumber: payoutDetails.accountNumber.trim(),
        bankName: payoutDetails.bankName?.trim() || undefined,
      },
    });

    await CreditTransaction.create({
      user: userId,
      type: 'payout_hold',
      amount: -credits,
      description: `Payout request hold (${credits} credits)`,
      source: 'system',
      payoutRef: payoutRequest._id,
    });

    res.status(201).json({
      payoutRequest: {
        id: payoutRequest._id.toString(),
        creditsRequested: payoutRequest.creditsRequested,
        amountPKR: payoutRequest.amountPKR,
        payoutMethod: payoutRequest.payoutMethod,
        status: payoutRequest.status,
        createdAt: payoutRequest.createdAt,
      },
      newBalance: wallet.balance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyPayoutRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_LIMIT));

    const filter = { teacher: userId };

    const [requests, totalCount] = await Promise.all([
      PayoutRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      PayoutRequest.countDocuments(filter),
    ]);

    res.json({
      requests: requests.map((r) => ({
        id: r._id.toString(),
        creditsRequested: r.creditsRequested,
        amountPKR: r.amountPKR,
        payoutMethod: r.payoutMethod,
        payoutDetails: r.payoutDetails,
        status: r.status,
        adminNote: r.adminNote,
        paymentReference: r.paymentReference,
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
      })),
      page,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
