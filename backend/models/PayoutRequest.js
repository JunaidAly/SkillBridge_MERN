import mongoose from 'mongoose';

const payoutRequestSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  creditsRequested: {
    type: Number,
    required: true,
    min: 1,
  },
  amountPKR: {
    type: Number,
    required: true,
  },
  payoutMethod: {
    type: String,
    enum: ['bank_transfer', 'jazzcash', 'easypaisa'],
    required: true,
  },
  payoutDetails: {
    accountTitle: String,
    accountNumber: String,
    bankName: String,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending',
  },
  adminNote: {
    type: String,
  },
  paymentReference: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
  },
});

payoutRequestSchema.index({ teacher: 1, status: 1 });
payoutRequestSchema.index({ teacher: 1, createdAt: -1 });

export default mongoose.model('PayoutRequest', payoutRequestSchema);
