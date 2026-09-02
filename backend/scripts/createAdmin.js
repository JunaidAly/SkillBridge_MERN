// One-time CLI script to promote an existing registered user to admin.
// Run manually: node scripts/createAdmin.js --email=you@example.com
// This must NEVER be exposed as an HTTP route - it is a local/ops tool only.
import readline from 'readline';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const askEmail = () =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Email of the user to promote to admin: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

const getEmailFromArgs = () => {
  const arg = process.argv.find((a) => a.startsWith('--email='));
  return arg ? arg.slice('--email='.length).trim() : null;
};

async function main() {
  const email = getEmailFromArgs() || (await askEmail());

  if (!email) {
    console.error('No email provided. Aborting.');
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    console.error(`No registered user found with email "${email}". This script only promotes existing accounts - register the account first, then re-run this script.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  if (user.role === 'admin') {
    console.log(`"${user.email}" is already an admin. Nothing to do.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  user.role = 'admin';
  await user.save();

  console.log(`✅ "${user.email}" (${user.name}) is now an admin.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error('Failed to create admin:', error.message);
  process.exit(1);
});
