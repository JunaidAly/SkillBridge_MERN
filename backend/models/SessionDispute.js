import mongoose from 'mongoose';

const sessionDisputeSchema = new mongoose.Schema(
  {
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'upheld', 'rejected'],
      default: 'pending',
    },
    adminNote: {
      type: String,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

sessionDisputeSchema.index({ meeting: 1, status: 1 });

export default mongoose.model('SessionDispute', sessionDisputeSchema);
