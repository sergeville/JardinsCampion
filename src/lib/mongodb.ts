import mongoose, { ConnectOptions } from 'mongoose';
import { withRetry } from './utils';

declare global {
  let mongoose:
    | {
        conn: mongoose.Connection | null;
        promise: Promise<mongoose.Connection> | null;
      }
    | undefined;
}

if (!process.env.MONGODB_URI_DEV || !process.env.MONGODB_URI_PROD) {
  console.error('Missing environment variables:');
  console.error('MONGODB_URI_DEV:', process.env.MONGODB_URI_DEV);
  console.error('MONGODB_URI_PROD:', process.env.MONGODB_URI_PROD);
  console.error('NODE_ENV:', process.env.NODE_ENV);
  throw new Error(
    'Please define the MONGODB_URI_DEV and MONGODB_URI_PROD environment variables inside .env.local\n' +
      'Example:\n' +
      'MONGODB_URI_DEV=mongodb://admin:devpassword@localhost:27019/jardins-campion-dev?authSource=admin\n' +
      'MONGODB_URI_PROD=mongodb://admin:prodpassword@localhost:27020/jardins-campion-prod?authSource=admin'
  );
}

const MONGODB_URI =
  process.env.NODE_ENV === 'production'
    ? process.env.MONGODB_URI_PROD
    : process.env.MONGODB_URI_DEV;

console.log('MongoDB URI:', MONGODB_URI);
console.log('NODE_ENV:', process.env.NODE_ENV);

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const CONNECTION_OPTIONS: ConnectOptions = {
  bufferCommands: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  replicaSet: 'rs0',
  directConnection: true,
  retryWrites: true,
  w: 'majority' as const,
  retryReads: true,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 2000,
};

async function createConnection() {
  console.log('Creating new MongoDB connection...');
  console.log('MongoDB URI:', MONGODB_URI);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Connection options:', CONNECTION_OPTIONS);

  try {
    const connection = await mongoose.connect(MONGODB_URI!, CONNECTION_OPTIONS);
    console.log(
      'MongoDB connected successfully to',
      process.env.NODE_ENV === 'production' ? 'production' : 'development',
      'database'
    );
    console.log('Connection state:', connection.connection.readyState);
    console.log('Database name:', connection.connection.name);

    // Handle connection errors
    connection.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      cached!.conn = null;
      cached!.promise = null;
    });

    // Handle disconnection
    connection.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Will attempt to reconnect...');
      cached!.conn = null;
      cached!.promise = null;
    });

    // Handle successful reconnection
    connection.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });

    return connection.connection;
  } catch (error) {
    console.error('Error creating MongoDB connection:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw error;
  }
}

async function connectDB() {
  try {
    if (cached?.conn) {
      // Check if the connection is still valid
      if (cached.conn.readyState === 1) {
        console.log('Using cached database connection');
        return cached.conn;
      } else {
        console.log('Cached connection is no longer valid, creating new connection');
        cached.conn = null;
        cached.promise = null;
      }
    }

    if (!cached?.promise) {
      cached!.promise = withRetry(createConnection, {
        maxRetries: 5,
        baseDelay: 1000,
        maxDelay: 10000,
        timeout: 30000,
      });
    }

    try {
      cached!.conn = await cached!.promise;
    } catch (error) {
      cached!.promise = null;
      throw error;
    }

    return cached!.conn;
  } catch (error) {
    console.error('Failed to establish MongoDB connection:', error);
    throw new Error(
      'Unable to connect to the database. Please check your connection and try again.'
    );
  }
}

// Add a health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const conn = await connectDB();
    return conn.readyState === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

export default connectDB;
