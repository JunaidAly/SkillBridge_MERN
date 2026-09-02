import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paddleTransactionId: {
      type: String,
      required: true,
      unique: true,
    },
    priceId: {
      type: String,
    },
    amountPaid: {
      type: Number,
    },
    currency: {
      type: String,
    },
    creditsGranted: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    rawPayload: {
      type: Object,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);
