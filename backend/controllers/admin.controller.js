import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import RefundRequest from '../models/RefundRequest.js';
import { CreditTransaction, CreditWallet } from '../models/Credit.js';
import { logAdminAction } from '../utils/auditLog.js';
import paddle from '../config/paddle.js';

const MAX_PAGE_LIMIT = 50;
const DEFAULT_PAGE_LIMIT = 10;
const MAX_ANALYTICS_DAYS = 365;
const DEFAULT_ANALYTICS_DAYS = 30;

// Valid values are read from the schema itself so this never drifts from the
// actual User model (rather than hardcoding a role list here).
const VALID_ROLES = User.schema.path('role').enumValues;

export const getAllTransactions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_LIMIT));

    const [transactions, totalCount, statsResult] = await Promise.all([
      Transaction.find({})
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments({}),
      Transaction.aggregate([
        {
          $group: {
            _id: null,
            // TODO: handle multi-currency - this assumes a single currency (USD) platform-wide.
            totalRevenue: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amountPaid', 0] },
            },
            totalTransactions: { $sum: 1 },
            completedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            failedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const stats = statsResult[0] || {
      totalRevenue: 0,
      totalTransactions: 0,
      completedCount: 0,
      failedCount: 0,
    };

    res.json({
      stats: {
        totalRevenue: stats.totalRevenue,
        totalTransactions: stats.totalTransactions,
        completedCount: stats.completedCount,
        failedCount: stats.failedCount,
        currency: 'USD',
      },
      transactions: transactions.map((t) => ({
        id: t._id.toString(),
        user: t.user
          ? { id: t.user._id.toString(), name: t.user.name, email: t.user.email }
          : null,
        priceId: t.priceId,
        creditsGranted: t.creditsGranted,
        amountPaid: t.amountPaid,
        currency: t.currency,
        status: t.status,
        createdAt: t.createdAt,
      })),
      page,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_LIMIT));
    const search = (req.query.search || '').trim();

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select('name email role createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      })),
      page,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }

    if (role !== 'admin' && req.user.userId === userId) {
      return res.status(400).json({ message: 'You cannot change your own role away from admin.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await logAdminAction({
      adminId: req.user.userId,
      action: 'role_change',
      targetUserId: user._id,
      details: { oldRole, newRole: role },
    });

    res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const days = Math.min(MAX_ANALYTICS_DAYS, Math.max(1, parseInt(req.query.days, 10) || DEFAULT_ANALYTICS_DAYS));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const [revenueByDay, userSignupsByDay, statusBreakdown] = await Promise.all([
      Transaction.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$amountPaid' },
            transactionCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Transaction.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const breakdown = { completed: 0, failed: 0, refunded: 0, pending: 0 };
    statusBreakdown.forEach((row) => {
      if (row._id in breakdown) breakdown[row._id] = row.count;
    });

    res.json({
      revenueByDay: revenueByDay.map((r) => ({
        date: r._id,
        revenue: r.revenue,
        transactionCount: r.transactionCount,
      })),
      userSignupsByDay: userSignupsByDay.map((r) => ({ date: r._id, count: r.count })),
      transactionStatusBreakdown: breakdown,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAuditLog = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_LIMIT));

    const [entries, totalCount] = await Promise.all([
      AdminAuditLog.find({})
        .populate('admin', 'name email')
        .populate('targetUser', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AdminAuditLog.countDocuments({}),
    ]);

    res.json({
      entries: entries.map((e) => ({
        id: e._id.toString(),
        action: e.action,
        admin: e.admin ? { id: e.admin._id.toString(), name: e.admin.name, email: e.admin.email } : null,
        targetUser: e.targetUser
          ? { id: e.targetUser._id.toString(), name: e.targetUser.name, email: e.targetUser.email }
          : null,
        details: e.details,
        createdAt: e.createdAt,
      })),
      page,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const VALID_VERIFICATION_STATUSES = User.schema.path('verificationStatus').enumValues;

export const getVerifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_LIMIT));
    const status = req.query.status;

    const filter = {};
    if (status) {
      if (!VALID_VERIFICATION_STATUSES.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_VERIFICATION_STATUSES.join(', ')}` });
      }
      filter.verificationStatus = status;
    }

    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select('name email verificationStatus verificationDocs verificationSubmittedAt verificationReviewedAt verificationRejectionReason skillsTeaching')
        .sort({ verificationSubmittedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        verificationStatus: u.verificationStatus,
        verificationDocs: u.verificationDocs,
        verificationSubmittedAt: u.verificationSubmittedAt,
        verificationReviewedAt: u.verificationReviewedAt,
        verificationRejectionReason: u.verificationRejectionReason,
        skillsTeaching: u.skillsTeaching,
      })),
      page,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reviewVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { decision, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: "decision must be 'approved' or 'rejected'" });
    }
    if (decision === 'rejected' && !rejectionReason?.trim()) {
      return res.status(400).json({ message: 'rejectionReason is required when rejecting' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.verificationStatus = decision === 'approved' ? 'verified' : 'rejected';
    user.verificationReviewedAt = new Date();
    user.verificationRejectionReason = decision === 'rejected' ? rejectionReason.trim() : undefined;
    await user.save();

    await logAdminAction({
      adminId: req.user.userId,
      action: decision === 'approved' ? 'verification_approved' : 'verification_rejected',
      targetUserId: user._id,
      details: decision === 'rejected' ? { rejectionReason: user.verificationRejectionReason } : null,
    });

    res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        verificationStatus: user.verificationStatus,
        verificationReviewedAt: user.verificationReviewedAt,
        verificationRejectionReason: user.verificationRejectionReason,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRefundRequests = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_LIMIT));
    const status = req.query.status;

    const filter = {};
    if (status) {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be one of: pending, approved, rejected' });
      }
      filter.status = status;
    }

    const [requests, totalCount] = await Promise.all([
      RefundRequest.find(filter)
        .populate('user', 'name email')
        .populate('transaction', 'amountPaid currency creditsGranted status createdAt paddleTransactionId')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      RefundRequest.countDocuments(filter),
    ]);

    res.json({
      requests: requests.map((r) => ({
        id: r._id.toString(),
        status: r.status,
        reason: r.reason,
        adminNote: r.adminNote,
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
        user: r.user ? { id: r.user._id.toString(), name: r.user.name, email: r.user.email } : null,
        transaction: r.transaction
          ? {
              id: r.transaction._id.toString(),
              amountPaid: r.transaction.amountPaid,
              currency: r.transaction.currency,
              creditsGranted: r.transaction.creditsGranted,
              status: r.transaction.status,
              createdAt: r.transaction.createdAt,
            }
          : null,
      })),
      page,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reviewRefundRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, adminNote } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: "decision must be 'approved' or 'rejected'" });
    }
    if (decision === 'rejected' && !adminNote?.trim()) {
      return res.status(400).json({ message: 'adminNote is required when rejecting' });
    }

    const refundRequest = await RefundRequest.findById(id).populate('transaction');
    if (!refundRequest) {
      return res.status(404).json({ message: 'Refund request not found' });
    }
    if (refundRequest.status !== 'pending') {
      return res.status(400).json({ message: `This refund request has already been ${refundRequest.status}.` });
    }

    if (decision === 'rejected') {
      refundRequest.status = 'rejected';
      refundRequest.adminNote = adminNote.trim();
      refundRequest.resolvedAt = new Date();
      await refundRequest.save();

      await logAdminAction({
        adminId: req.user.userId,
        action: 'refund_rejected',
        targetUserId: refundRequest.user,
        details: { refundRequestId: refundRequest._id.toString(), adminNote: refundRequest.adminNote },
      });

      return res.json({
        refundRequest: {
          id: refundRequest._id.toString(),
          status: refundRequest.status,
          adminNote: refundRequest.adminNote,
          resolvedAt: refundRequest.resolvedAt,
        },
      });
    }

    // decision === 'approved' - a REAL Paddle refund must succeed before any DB record
    // is marked approved. Never flip our own status optimistically ahead of Paddle.
    const transaction = refundRequest.transaction;
    if (!transaction || !transaction.paddleTransactionId) {
      return res.status(400).json({ message: 'This refund request is not linked to a valid Paddle transaction.' });
    }

    let adjustment;
    try {
      adjustment = await paddle.adjustments.create({
        action: 'refund',
        reason: refundRequest.reason,
        transactionId: transaction.paddleTransactionId,
        type: 'full',
      });
    } catch (paddleError) {
      console.error('Paddle refund failed:', paddleError.message);
      return res.status(502).json({
        message: `Paddle refund failed: ${paddleError.message}. The refund was NOT approved - nothing was changed.`,
      });
    }

    // Paddle has now actually refunded the money - this is the point of no return.
    // Mark the request approved IMMEDIATELY, before any other write, so that if something
    // below fails and the admin retries, the pending-status guard above stops us from ever
    // calling Paddle's refund a second time for the same request.
    refundRequest.status = 'approved';
    refundRequest.adminNote = adminNote?.trim() || undefined;
    refundRequest.resolvedAt = new Date();
    try {
      await refundRequest.save();
    } catch (saveError) {
      console.error(
        `CRITICAL: Paddle refund ${adjustment.id} succeeded for RefundRequest ${refundRequest._id} but saving the approved status failed:`,
        saveError
      );
      return res.status(500).json({
        message: `Paddle refund succeeded (adjustment ${adjustment.id}), but recording the approval failed: ${saveError.message}. Money has already moved - do NOT retry this approval. Manually set RefundRequest ${refundRequest._id} to 'approved' and reconcile the wallet.`,
      });
    }

    // Wallet balance, the credit ledger entry, and flipping the transaction to 'refunded' must
    // all move together - wrap them in a real Mongo transaction so a mid-way failure can't leave
    // one applied and the other not. The refund itself is already approved and done regardless
    // of whether this group succeeds; a failure here just needs manual reconciliation, not a
    // second Paddle call.
    const creditsToDeduct = transaction.creditsGranted || 0;
    let creditNote = null;
    let followUpError = null;

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const wallet = await CreditWallet.findOne({ user: refundRequest.user }).session(session);

        if (wallet && creditsToDeduct > 0) {
          const actualDeduction = Math.min(wallet.balance, creditsToDeduct);
          wallet.balance = Math.max(0, wallet.balance - creditsToDeduct);
          wallet.totalSpent += actualDeduction;
          await wallet.save({ session });

          if (actualDeduction < creditsToDeduct) {
            creditNote = `User had already spent ${creditsToDeduct - actualDeduction} of the ${creditsToDeduct} refunded credits; balance floored at 0 instead of going negative.`;
          }

          await CreditTransaction.create(
            [{
              user: refundRequest.user,
              type: 'refund',
              amount: -actualDeduction,
              description: `Refund approved for transaction ${transaction._id}`,
              source: 'admin',
              transactionRef: transaction._id,
            }],
            { session }
          );
        }

        transaction.status = 'refunded';
        await transaction.save({ session });
      });
    } catch (txError) {
      followUpError = txError;
      console.error(
        `CRITICAL: Paddle refund ${adjustment.id} and RefundRequest ${refundRequest._id} approval both succeeded, but the wallet/transaction update failed and was rolled back:`,
        txError
      );
    } finally {
      await session.endSession();
    }

    if (creditNote) {
      refundRequest.adminNote = [refundRequest.adminNote, creditNote].filter(Boolean).join(' ');
      await refundRequest.save().catch((e) => console.error('Failed to save creditNote onto refundRequest:', e.message));
    }

    await logAdminAction({
      adminId: req.user.userId,
      action: 'refund_approved',
      targetUserId: refundRequest.user,
      details: {
        refundRequestId: refundRequest._id.toString(),
        transactionId: transaction._id.toString(),
        paddleAdjustmentId: adjustment.id,
        paddleAdjustmentStatus: adjustment.status,
        creditsDeducted: creditsToDeduct,
        walletSyncFailed: !!followUpError,
      },
    });

    if (followUpError) {
      return res.json({
        refundRequest: {
          id: refundRequest._id.toString(),
          status: refundRequest.status,
          adminNote: refundRequest.adminNote,
          resolvedAt: refundRequest.resolvedAt,
        },
        paddleAdjustment: { id: adjustment.id, status: adjustment.status },
        warning: `Paddle refund succeeded and is recorded as approved, but updating the wallet/transaction failed (${followUpError.message}). Please reconcile transaction ${transaction._id} and the user's wallet manually - do not re-approve.`,
      });
    }

    res.json({
      refundRequest: {
        id: refundRequest._id.toString(),
        status: refundRequest.status,
        adminNote: refundRequest.adminNote,
        resolvedAt: refundRequest.resolvedAt,
      },
      paddleAdjustment: { id: adjustment.id, status: adjustment.status },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
