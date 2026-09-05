// Tracks which userIds currently have at least one open socket. Multiple
// tabs/devices for the same user map to the same userId key, hence a Set of
// socket ids per user rather than a single flag.
const onlineUsers = new Map();

export function addOnlineSocket(userId, socketId) {
  const key = String(userId);
  const wasOffline = !onlineUsers.has(key);
  if (wasOffline) onlineUsers.set(key, new Set());
  onlineUsers.get(key).add(socketId);
  return wasOffline;
}

export function removeOnlineSocket(userId, socketId) {
  const key = String(userId);
  const sockets = onlineUsers.get(key);
  if (!sockets) return false;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(key);
    return true;
  }
  return false;
}

export function isUserOnline(userId) {
  return onlineUsers.has(String(userId));
}

export function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}
