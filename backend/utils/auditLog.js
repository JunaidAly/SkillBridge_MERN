import AdminAuditLog from '../models/AdminAuditLog.js';

// Never let a logging failure block the admin action it's recording.
export const logAdminAction = async ({ adminId, action, targetUserId, details }) => {
  try {
    await AdminAuditLog.create({
      admin: adminId,
      action,
      targetUser: targetUserId || null,
      details: details || null,
    });
  } catch (error) {
    console.error('Failed to write admin audit log:', error.message);
  }
};
