import mongoose, { ConnectOptions } from 'mongoose';
import { MongoClient } from 'mongodb';
import { NetworkError } from './errors/types';
import { ErrorSeverity, ErrorCategory } from './errors/types';

const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;
const MAX_RETRIES = 3;

const MONGODB_URI =
  process.env.NODE_ENV === 'production'
    ? process.env.MONGODB_URI_PROD
    : process.env.MONGODB_URI_DEV;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI_DEV or MONGODB_URI_PROD environment variable inside .env.local'
  );
}

let cachedConnection: typeof mongoose | null = null;
let connectionPromise: Promise<typeof mongoose> | null = null;

export const connectDB = async (): Promise<typeof mongoose> => {
  if (cachedConnection) {
    return cachedConnection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const opts: ConnectOptions = {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
    authSource: 'admin',
    replicaSet: process.env.NODE_ENV === 'production' ? 'rs1' : 'rs0',
    retryWrites: true,
    retryReads: true,
    writeConcern: {
      w: 1,
      j: true,
    },
  };

  connectionPromise = mongoose.connect(MONGODB_URI as string, opts);

  try {
    cachedConnection = await connectionPromise;
    connectionPromise = null;
    return cachedConnection;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
};

export const disconnectFromDatabase = async (): Promise<void> => {
  if (cachedConnection) {
    try {
      await mongoose.disconnect();
      cachedConnection = null;
      connectionPromise = null;
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }
};

export const getBackoffDelay = (attempt: number): number => {
  return Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt), MAX_RETRY_DELAY);
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  initialDelay: number = INITIAL_RETRY_DELAY,
  maxDelay: number = MAX_RETRY_DELAY
): Promise<T> => {
  let currentDelay = initialDelay;
  let attempt = 1;

  while (true) {
    try {
      console.log(`Attempting operation (attempt ${attempt}/${maxRetries})...`);
      console.time(`attempt-${attempt}`);
      const result = await operation();
      console.timeEnd(`attempt-${attempt}`);
      console.log('Operation successful');
      return result;
    } catch (error) {
      console.timeEnd(`attempt-${attempt}`);
      console.error(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);

      if (attempt >= maxRetries) {
        console.error('Max retries reached, giving up');
        throw error;
      }

      console.log(`Retrying in ${currentDelay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, currentDelay));

      // Exponential backoff with jitter
      const jitter = Math.random() * 200 - 100; // ±100ms
      currentDelay = Math.min(currentDelay * 2 + jitter, maxDelay);
      attempt++;

      console.log('Retry details:', {
        attempt,
        currentDelay,
        maxRetries,
        remainingRetries: maxRetries - attempt,
      });
    }
  }
};

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const connection = await connectDB();
    return connection.connection.readyState === 1;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
};
