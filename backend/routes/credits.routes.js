import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { CreditWallet, CreditTransaction } from '../models/Credit.js';
import User from '../models/User.js';

const router = express.Router();

// Credits awarded per session
const CREDITS_PER_TEACHING_SESSION = 25;
const CREDITS_PER_LEARNING_SESSION = 25;
const INITIAL_FREE_CREDITS = 100;

// Get or create user's wallet
async function getOrCreateWallet(userId) {
  let wallet = await CreditWallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await CreditWallet.create({
      user: userId,
      balance: INITIAL_FREE_CREDITS,
      totalEarned: INITIAL_FREE_CREDITS,
      totalSpent: 0,
    });
    // Record initial bonus transaction
    await CreditTransaction.create({
      user: userId,
      type: 'bonus',
      amount: INITIAL_FREE_CREDITS,
      description: 'Welcome bonus credits',
    });
  }
  return wallet;
}

// Get wallet info and recent transactions
router.get('/wallet', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const wallet = await getOrCreateWallet(userId);

    // Get stats for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyStats = await CreditTransaction.aggregate([
      {
        $match: {
          user: wallet.user,
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          earned: {
            $sum: {
              $cond: [{ $gt: ['$amount', 0] }, '$amount', 0],
            },
          },
          spent: {
            $sum: {
              $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0],
            },
          },
        },
      },
    ]);

    const stats = monthlyStats[0] || { earned: 0, spent: 0 };

    res.json({
      success: true,
      wallet: {
        balance: wallet.balance,
        totalEarned: wallet.totalEarned,
        totalSpent: wallet.totalSpent,
        earnedThisMonth: stats.earned,
        spentThisMonth: stats.spent,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transaction history
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;

    const transactions = await CreditTransaction.find({ user: userId })
      .populate('otherUser', 'name avatar')
      .populate('meeting', 'title startsAt')
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await CreditTransaction.countDocuments({ user: userId });

    res.json({
      success: true,
      transactions,
      total,
      hasMore: Number(offset) + transactions.length < total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Process teaching credits (called when a meeting is scheduled where user is teaching)
router.post('/earn/teaching', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { meetingId, learnerId } = req.body;

    if (!learnerId) return res.status(400).json({ message: 'learnerId is required' });

    const learner = await User.findById(learnerId).select('name');
    if (!learner) return res.status(404).json({ message: 'Learner not found' });

    const wallet = await getOrCreateWallet(userId);

    // Add credits for teaching
    wallet.balance += CREDITS_PER_TEACHING_SESSION;
    wallet.totalEarned += CREDITS_PER_TEACHING_SESSION;
    await wallet.save();

    // Record transaction
    const transaction = await CreditTransaction.create({
      user: userId,
      type: 'teaching',
      amount: CREDITS_PER_TEACHING_SESSION,
      description: `Teaching session with ${learner.name}`,
      meeting: meetingId || null,
      otherUser: learnerId,
    });

    res.json({
      success: true,
      transaction,
      newBalance: wallet.balance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Process learning credits (called when user schedules to learn)
router.post('/spend/learning', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { meetingId, teacherId } = req.body;

    if (!teacherId) return res.status(400).json({ message: 'teacherId is required' });

    const teacher = await User.findById(teacherId).select('name');
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    const wallet = await getOrCreateWallet(userId);

    // Check if user has enough credits
    if (wallet.balance < CREDITS_PER_LEARNING_SESSION) {
      return res.status(400).json({
        message: 'Insufficient credits',
        required: CREDITS_PER_LEARNING_SESSION,
        balance: wallet.balance,
      });
    }

    // Deduct credits for learning
    wallet.balance -= CREDITS_PER_LEARNING_SESSION;
    wallet.totalSpent += CREDITS_PER_LEARNING_SESSION;
    await wallet.save();

    // Record transaction
    const transaction = await CreditTransaction.create({
      user: userId,
      type: 'learning',
      amount: -CREDITS_PER_LEARNING_SESSION,
      description: `Learning session with ${teacher.name}`,
      meeting: meetingId || null,
      otherUser: teacherId,
    });

    res.json({
      success: true,
      transaction,
      newBalance: wallet.balance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check if user can afford a learning session
router.get('/check-balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const wallet = await getOrCreateWallet(userId);

    res.json({
      success: true,
      balance: wallet.balance,
      canAffordSession: wallet.balance >= CREDITS_PER_LEARNING_SESSION,
      sessionCost: CREDITS_PER_LEARNING_SESSION,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
