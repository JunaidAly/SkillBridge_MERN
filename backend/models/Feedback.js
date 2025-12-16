import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      default: null,
    },
    skill: {
      type: String,
      trim: true,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Prevent duplicate feedback for the same meeting from the same user
feedbackSchema.index({ fromUser: 1, toUser: 1, meeting: 1 }, { unique: true, sparse: true });
feedbackSchema.index({ toUser: 1, createdAt: -1 });
feedbackSchema.index({ fromUser: 1, createdAt: -1 });

export default mongoose.model('Feedback', feedbackSchema);

