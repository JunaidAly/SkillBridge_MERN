import mongoose from 'mongoose';

const adminAuditLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  details: {
    type: Object,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

adminAuditLogSchema.index({ createdAt: -1 });

export default mongoose.model('AdminAuditLog', adminAuditLogSchema);
