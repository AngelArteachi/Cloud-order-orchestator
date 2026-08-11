import mongoose from 'mongoose';
import { env } from './env';

export const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('✅ Connected to MongoDB database via Mongoose');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectMongoDB = async (): Promise<void> => {
  await mongoose.disconnect();
};
