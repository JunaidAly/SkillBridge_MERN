import { CreditWallet } from '../models/Credit.js';
import { notifyUser } from './notify.js';
import { LOW_BALANCE_THRESHOLD } from '../config/sessionCreditRates.js';

// New users start with an empty, cashable wallet - no bonus credits. Their
// one free session as a student is handled separately (Meeting.isFreeTrialSession),
// which never touches the wallet/payout system at all. See User.freeTrialSessionUsed.
export async function getOrCreateWallet(userId) {
  let wallet = await CreditWallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await CreditWallet.create({
      user: userId,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
    });
  }
  return wallet;
}

// --------------------------------------------------------------------------
// Every balance change goes through these. They only ever touch the two
// buckets - `balance` is recomputed by the model's pre-save hook, so nothing
// can set a total that disagrees with its parts.
// --------------------------------------------------------------------------

/** Credits bought with money, or granted as a bonus. Spendable, not cashable. */
export function addPurchasedCredits(wallet, amount) {
  wallet.purchasedBalance += amount;
}

/** Credits earned by teaching. Spendable and cashable. */
export function addEarnedCredits(wallet, amount) {
  wallet.earnedBalance += amount;
  wallet.totalEarned += amount;
}

/**
 * Spends from the purchased bucket first, falling back to earned.
 *
 * That order is deliberate: a teacher's earnings stay intact (and therefore
 * cashable) for as long as possible, and a student's bought credits are used
 * for exactly what they were bought for. Returns false and changes nothing if
 * the wallet can't cover it.
 */
export function spendCredits(wallet, amount) {
  if (wallet.purchasedBalance + wallet.earnedBalance < amount) return false;

  const fromPurchased = Math.min(wallet.purchasedBalance, amount);
  wallet.purchasedBalance -= fromPurchased;
  wallet.earnedBalance -= amount - fromPurchased;
  wallet.totalSpent += amount;
  return true;
}

/** Moves earned credits out for a payout. Only earned credits are cashable. */
export function holdEarnedForPayout(wallet, amount) {
  if (wallet.earnedBalance < amount) return false;
  wallet.earnedBalance -= amount;
  return true;
}

/** Returns credits to the earned bucket when a payout is rejected/reversed. */
export function releaseEarnedFromPayout(wallet, amount) {
  wallet.earnedBalance += amount;
}

// Only fires the notification the moment a spend crosses the threshold, not
// on every subsequent spend once the user is already below it.
export function notifyIfCrossedLowBalance(userId, balanceBefore, balanceAfter) {
  if (balanceBefore >= LOW_BALANCE_THRESHOLD && balanceAfter < LOW_BALANCE_THRESHOLD) {
    notifyUser({
      userId,
      type: 'credit_low_balance',
      title: 'Your credit balance is running low',
      body: `You have ${balanceAfter} credits left. Buy more to keep booking sessions.`,
      link: '/credits',
    });
  }
}
