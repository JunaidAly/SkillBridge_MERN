import mongoose from 'mongoose';

await mongoose.connect('mongodb+srv://juanidalikhan03_db_user:juOpQFgFSryFN6SX@cluster0.4rzasvw.mongodb.net/test');

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));

const result = await User.updateOne(
  { email: 'skillbridgeadmin@gmail.com' },
  { $set: { role: 'admin' } }
);

console.log('✅ User updated to admin:', result.modifiedCount > 0);

process.exit(0);
