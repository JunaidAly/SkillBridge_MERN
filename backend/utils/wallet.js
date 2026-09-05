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
