import mongoose from 'mongoose';

const creditTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['teaching', 'learning', 'purchase', 'bonus', 'refund', 'payout_hold', 'payout_reversal'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      default: null,
    },
    otherUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    source: {
      type: String,
      enum: ['safepay', 'admin', 'system'],
      default: 'system',
    },
    transactionRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    payoutRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayoutRequest',
      default: null,
    },
  },
  { timestamps: true }
);

creditTransactionSchema.index({ user: 1, createdAt: -1 });

const creditWalletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Credits are held in two buckets because only what a teacher EARNED may
    // be cashed out. Letting purchased credits reach a payout would turn the
    // platform into a card-to-bank transfer: buy with a card, withdraw to a
    // bank account, bypassing refunds entirely.
    //
    // `balance` stays as the spendable total and is recomputed from the two
    // buckets on every save (see the hook below), so it can never drift.
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Bought with money, or granted as a bonus. Spendable, never cashable.
    purchasedBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Earned by teaching. Spendable AND cashable.
    earnedBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Single source of truth for the spendable total. Every mutation goes through
// the helpers in utils/wallet.js, which only touch the buckets.
creditWalletSchema.pre('save', function (next) {
  this.balance = (this.purchasedBalance || 0) + (this.earnedBalance || 0);
  next();
});

export const CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);
export const CreditWallet = mongoose.model('CreditWallet', creditWalletSchema);
