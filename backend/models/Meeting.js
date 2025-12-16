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
  },
  { timestamps: true }
);

meetingSchema.index({ participants: 1, startsAt: 1 });

export default mongoose.model('Meeting', meetingSchema);


