import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    title: {
      type: String,
      trim: true,
      required: true,
    },
    startsAt: {
      type: Date,
      required: true,
    },
    // Duration in minutes (default 60 minutes)
    duration: {
      type: Number,
      default: 60,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },
    provider: {
      type: String,
      enum: ['jitsi'],
      default: 'jitsi',
    },
    roomName: {
      type: String,
      required: true,
      trim: true,
    },
    joinUrl: {
      type: String,
      required: true,
      trim: true,
    },
    // Session type: teaching or learning (from creator's perspective)
    sessionType: {
      type: String,
      enum: ['teaching', 'learning'],
      required: true,
    },
    // Skill being taught/learned
    skill: {
      type: String,
      trim: true,
      default: null,
    },
    // Status: scheduled, completed, cancelled
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    // Rating given by the learner (1-5)
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  { timestamps: true }
);

meetingSchema.index({ participants: 1, startsAt: 1 });
meetingSchema.index({ status: 1, startsAt: 1 });

export default mongoose.model('Meeting', meetingSchema);


