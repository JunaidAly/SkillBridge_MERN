import mongoose from 'mongoose';

const verificationCodeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      length: 6,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    purpose: {
      type: String,
      enum: ['signup', 'login'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for cleanup
verificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
verificationCodeSchema.index({ email: 1, purpose: 1 });

export default mongoose.model('VerificationCode', verificationCodeSchema);

