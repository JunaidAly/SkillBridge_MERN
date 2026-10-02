// One-time migration for labelled verification documents.
//
// `verificationDocs` used to be a plain array of URL strings. It now holds
// objects ({ url, docType, fileName }) so an admin can see what each file is
// meant to be. Any string left behind would fail to cast once the schema
// changes, so this converts them in place and tags them as 'other'.
//
// Uses the raw driver on purpose - it has to run regardless of what the
// Mongoose schema currently says.
//
// Run once:  node scripts/migrateVerificationDocs.js  [--dry-run]
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { DEFAULT_VERIFICATION_DOC_TYPE } from '../config/verificationDocTypes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  await connectDB();

  const users = mongoose.connection.db.collection('users');
  const candidates = await users
    .find({ verificationDocs: { $type: 'string' } }, { projection: { verificationDocs: 1, name: 1 } })
    .toArray();

  // $type on an array field matches when ANY element is a string.
  const needsWork = candidates.filter((u) =>
    (u.verificationDocs || []).some((d) => typeof d === 'string')
  );

  if (needsWork.length === 0) {
    console.log('Nothing to migrate - no string entries found.');
  }

  for (const user of needsWork) {
    const converted = user.verificationDocs.map((doc) =>
      typeof doc === 'string'
        ? { url: doc, docType: DEFAULT_VERIFICATION_DOC_TYPE, fileName: '' }
        : doc
    );

    console.log(`${dryRun ? '[dry run] ' : ''}${user.name}: ${converted.length} doc(s) -> objects`);
    if (!dryRun) {
      await users.updateOne({ _id: user._id }, { $set: { verificationDocs: converted } });
    }
  }

  await mongoose.connection.close();
}

main().catch(async (err) => {
  console.error('Migration failed:', err.message);
  await mongoose.connection.close();
  process.exit(1);
});
