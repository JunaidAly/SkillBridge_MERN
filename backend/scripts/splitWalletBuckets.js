// One-time migration for the split credit wallet.
//
// A wallet used to hold a single `balance`, which meant purchased credits
// could be cashed out through a payout. Credits now sit in two buckets:
// `earnedBalance` (from teaching, cashable) and `purchasedBalance` (bought or
// granted, spendable only).
//
// Existing balances are split from the CreditTransaction ledger: whatever a
// user actually earned by teaching - minus payouts already taken against it -
// becomes their earned bucket, capped at what they still hold. Everything left
// is treated as purchased, which is the conservative reading: a credit is only
// cashable if we can point at the teaching that produced it.
//
// Run once:  node scripts/splitWalletBuckets.js  [--dry-run]
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { CreditWallet, CreditTransaction } from '../models/Credit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Types that represent credits a user earned rather than bought. `bonus` is
// deliberately excluded - promotional credits were never earned, so the
// platform should not owe cash against them.
const EARNING_TYPES = ['teaching'];
// Payouts already drawn against earned credits, and reversals of those.
const PAYOUT_TYPES = ['payout_hold', 'payout_reversal'];

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  await connectDB();

  const wallets = await CreditWallet.find({});
  let changed = 0;

  for (const wallet of wallets) {
    const ledger = await CreditTransaction.aggregate([
      { $match: { user: wallet.user } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    const sum = (types) =>
      ledger.filter((l) => types.includes(l._id)).reduce((acc, l) => acc + l.total, 0);

    // payout_hold entries are negative, so adding them nets the withdrawals out.
    const earnedNet = sum(EARNING_TYPES) + sum(PAYOUT_TYPES);
    const earned = Math.max(0, Math.min(wallet.balance, earnedNet));
    const purchased = Math.max(0, wallet.balance - earned);

    const alreadySplit =
      wallet.purchasedBalance === purchased && wallet.earnedBalance === earned;
    if (alreadySplit) continue;

    console.log(
      `${dryRun ? '[dry run] ' : ''}wallet ${wallet.user}: ${wallet.balance} -> ` +
      `purchased ${purchased} + earned ${earned}`
    );

    if (!dryRun) {
      wallet.purchasedBalance = purchased;
      wallet.earnedBalance = earned;
      await wallet.save(); // the pre-save hook recomputes `balance`
    }
    changed += 1;
  }

  console.log(`${dryRun ? 'Would update' : 'Updated'} ${changed} of ${wallets.length} wallet(s).`);
  await mongoose.connection.close();
}

main().catch(async (err) => {
  console.error('Migration failed:', err.message);
  await mongoose.connection.close();
  process.exit(1);
});
