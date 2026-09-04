import { CreditWallet, CreditTransaction } from '../models/Credit.js';
import { notifyUser } from './notify.js';
import { INITIAL_FREE_CREDITS, LOW_BALANCE_THRESHOLD } from '../config/sessionCreditRates.js';

export async function getOrCreateWallet(userId) {
  let wallet = await CreditWallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await CreditWallet.create({
      user: userId,
      balance: INITIAL_FREE_CREDITS,
      totalEarned: INITIAL_FREE_CREDITS,
      totalSpent: 0,
    });
    await CreditTransaction.create({
      user: userId,
      type: 'bonus',
      amount: INITIAL_FREE_CREDITS,
      description: 'Welcome bonus credits',
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
