import mongoose from 'mongoose';

await mongoose.connect('mongodb+srv://juanidalikhan03_db_user:juOpQFgFSryFN6SX@cluster0.4rzasvw.mongodb.net/test');

const VerificationCode = mongoose.model('VerificationCode', new mongoose.Schema({}, { strict: false, collection: 'verificationcodes' }));

const codes = await VerificationCode.find({ 
  email: 'skillbridgeadmin@gmail.com' 
}).sort({ createdAt: -1 }).limit(1);

if (codes[0]) {
  console.log('Verification Code:', codes[0].code);
} else {
  console.log('No code found');
}

process.exit(0);
