import mongoose from 'mongoose';
import { env } from './env';

let isConnected = false;

export function isDBConnected(): boolean {
  return isConnected;
}

export async function connectDB(): Promise<void> {
  const MAX_RETRIES = 5;
  const RETRY_DELAY_MS = 3000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      isConnected = true;
      console.log('✅ MongoDB connected');
      return;
    } catch (error: any) {
      console.warn(`⚠️  MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);
      if (attempt < MAX_RETRIES) {
        await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      }
    }
  }
  console.warn('⚠️  MongoDB unavailable — running in memory-only mode (data will not persist)');
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️  MongoDB disconnected');
});
mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('✅ MongoDB reconnected');
});
