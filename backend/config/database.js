import mongoose from 'mongoose';

// Resolving the Atlas SRV record has been measured at ~18s on some networks,
// well past Mongoose's 10s default for buffered operations. Without these the
// first query fired during a slow-but-healthy connect throws
// "buffering timed out after 10000ms" and takes the process down with it.
mongoose.set('bufferTimeoutMS', 45000);

export const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables. Please check your .env file.');
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

