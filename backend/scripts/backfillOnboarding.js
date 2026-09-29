// One-time migration for the post-signup onboarding wizard.
//
// `onboardingCompleted` defaults to false so every NEW signup gets the wizard.
// Without this backfill that default would also apply to accounts created
// before the wizard existed, interrupting people already using the app. This
// marks all pre-existing accounts as done.
//
// Run once after deploying the wizard:  node scripts/backfillOnboarding.js
// Add --dry-run to only report what would change.
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  await connectDB();

  // Matches accounts that predate the field entirely, plus any created between
  // the deploy and this script running.
  const filter = { $or: [{ onboardingCompleted: { $exists: false } }, { onboardingCompleted: false }] };
  const affected = await User.countDocuments(filter);

  if (dryRun) {
    console.log(`[dry run] ${affected} user(s) would be marked onboardingCompleted: true`);
  } else {
    const result = await User.updateMany(filter, { $set: { onboardingCompleted: true } });
    console.log(`Marked ${result.modifiedCount} existing user(s) as onboardingCompleted: true`);
  }

  await mongoose.connection.close();
}

main().catch(async (err) => {
  console.error('Backfill failed:', err.message);
  await mongoose.connection.close();
  process.exit(1);
});
