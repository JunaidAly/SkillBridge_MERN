import User from '../models/User.js';

// True if either user has blocked the other.
export async function isBlockedBetween(userIdA, userIdB) {
  const [a, b] = await Promise.all([
    User.findById(userIdA).select('blockedUsers'),
    User.findById(userIdB).select('blockedUsers'),
  ]);
  const aBlockedB = a?.blockedUsers?.some((id) => String(id) === String(userIdB));
  const bBlockedA = b?.blockedUsers?.some((id) => String(id) === String(userIdA));
  return Boolean(aBlockedB || bBlockedA);
}
