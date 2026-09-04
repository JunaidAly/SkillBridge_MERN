import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    required: true,
    enum: [
      'new_message', 'meeting_reminder', 'meeting_confirmed', 'meeting_cancelled',
      'credit_low_balance', 'verification_approved', 'verification_rejected',
      'refund_approved', 'refund_rejected', 'payout_approved', 'payout_rejected', 'payout_paid',
    ],
  },
  title: { type: String, required: true },
  body: { type: String },
  link: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
