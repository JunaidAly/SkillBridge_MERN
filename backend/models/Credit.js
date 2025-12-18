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
      enum: ['teaching', 'learning', 'purchase', 'bonus', 'refund'],
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
    balance: {
      type: Number,
      default: 100, // Initial free credits for new users
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

export const CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);
export const CreditWallet = mongoose.model('CreditWallet', creditWalletSchema);
