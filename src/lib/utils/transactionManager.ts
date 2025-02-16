import mongoose, { ClientSession } from 'mongoose';
import { executeWithTimeout } from '../utils';
import { NetworkError } from '@/lib/errors/types';

// Maximum number of transaction retries
const MAX_TRANSACTION_RETRIES = 3;
// Initial delay for transaction retry (1000ms)
const INITIAL_RETRY_DELAY = 1000;
// Maximum delay between retries (8 seconds)
const MAX_RETRY_DELAY = 8000;
// Transaction timeout (15 seconds)
const TRANSACTION_TIMEOUT = 15000;

export class TransactionError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly isDeadlock?: boolean,
    public readonly attempt?: number,
    public readonly code?: number,
    public readonly errorLabels?: string[]
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

interface TransactionOptions {
  timeout?: number;
  maxRetries?: number;
  initialRetryDelay?: number;
  maxRetryDelay?: number;
  isolationLevel?: 'readUncommitted' | 'readCommitted' | 'repeatableRead' | 'snapshot';
  shouldRetry?: (error: TransactionError, options: TransactionOptions) => boolean;
}

interface TransactionResult<T> {
  data: T;
  error?: Error;
  status: 'success' | 'error';
}

function isDeadlockError(error: TransactionError): boolean {
  return !!(
    error.code === 11000 || // Duplicate key error
    error.message?.toLowerCase().includes('deadlock') ||
    error.message?.toLowerCase().includes('lock timeout') ||
    error.message?.toLowerCase().includes('transaction aborted') ||
    error.errorLabels?.includes('TransientTransactionError') ||
    error.errorLabels?.includes('RetryableWriteError')
  );
}

function getRetryDelay(attempt: number, options: Required<TransactionOptions>): number {
  const delay = Math.min(options.initialRetryDelay * Math.pow(2, attempt), options.maxRetryDelay);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * (delay * 0.1);
}

function defaultShouldRetry(error: TransactionError): boolean {
  return !!(isDeadlockError(error) || error.errorLabels?.includes('TransientTransactionError'));
}

export async function withTransaction<T>(
  operation: (session: ClientSession) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const {
    timeout = TRANSACTION_TIMEOUT,
    maxRetries = MAX_TRANSACTION_RETRIES,
    initialRetryDelay = INITIAL_RETRY_DELAY,
    maxRetryDelay = MAX_RETRY_DELAY,
    isolationLevel = 'readCommitted',
    shouldRetry = defaultShouldRetry,
  } = options;

  const fullOptions = {
    timeout,
    maxRetries,
    initialRetryDelay,
    maxRetryDelay,
    isolationLevel,
    shouldRetry: (error: TransactionError, opts: TransactionOptions) => shouldRetry(error, opts),
  };

  let attempt = 0;
  let lastError: Error | undefined;

  while (attempt < maxRetries) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction({
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority', j: true },
        readPreference: 'primary',
        maxCommitTimeMS: timeout,
      });

      console.log(`Starting transaction attempt ${attempt + 1}/${maxRetries}`);

      // Execute the operation with a timeout
      const result = await executeWithTimeout(operation(session), timeout);

      // Commit with retry for network errors
      try {
        console.log('Committing transaction...');
        await session.commitTransaction();
        console.log('Transaction committed successfully');
        await session.endSession();
        return result;
      } catch (commitError: any) {
        console.error('Error during transaction commit:', commitError);

        if (commitError.errorLabels?.includes('UnknownTransactionCommitResult')) {
          console.warn('Uncertain transaction commit result, checking operation status...');
          if (await verifyOperationResult(result)) {
            console.log('Operation result verified, transaction successful');
            return result;
          }
          throw new TransactionError('Transaction commit failed', commitError);
        }
        throw commitError;
      }
    } catch (error: any) {
      console.error(`Transaction attempt ${attempt + 1} failed:`, error);

      await session.abortTransaction().catch((err) => {
        console.error('Error aborting transaction:', err);
      });

      await session.endSession().catch((err) => {
        console.error('Error ending session:', err);
      });

      lastError = error;

      const isRetryable =
        isDeadlockError(error) ||
        error.errorLabels?.includes('TransientTransactionError') ||
        error.name === 'MongoNetworkError';

      // Check if we should retry
      if (attempt < maxRetries - 1 && isRetryable) {
        const delay = getRetryDelay(attempt, fullOptions);
        console.warn(
          `Transaction attempt ${attempt + 1}/${maxRetries} failed, retrying in ${Math.round(delay)}ms:`,
          error.message
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
        continue;
      }

      // If we shouldn't retry, throw the error
      throw new TransactionError(
        `Transaction failed after ${attempt + 1} attempts`,
        error,
        isDeadlockError(error),
        attempt + 1,
        error.code,
        error.errorLabels
      );
    }
  }

  throw new TransactionError(
    `Transaction failed after ${maxRetries} attempts`,
    lastError,
    false,
    maxRetries
  );
}

async function verifyOperationResult<T>(result: T): Promise<boolean> {
  if (!result) return false;

  // If result is a mongoose document, verify it exists in the database
  if (result instanceof mongoose.Document) {
    const Model = result.constructor as mongoose.Model<T>;
    const doc = await Model.findById(result._id).exec();
    return !!doc;
  }

  // Add more verification logic as needed
  return true;
}

// Helper function to retry individual operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Omit<TransactionOptions, 'isolationLevel'> = {}
): Promise<T> {
  const {
    maxRetries = MAX_TRANSACTION_RETRIES,
    initialRetryDelay = INITIAL_RETRY_DELAY,
    maxRetryDelay = MAX_RETRY_DELAY,
    timeout = TRANSACTION_TIMEOUT,
  } = options;

  let attempt = 0;
  let lastError: Error | undefined;

  while (attempt < maxRetries) {
    try {
      return await executeWithTimeout(operation(), timeout);
    } catch (error: any) {
      lastError = error;

      if (
        attempt < maxRetries - 1 &&
        (error.code === 11000 || error.errorLabels?.includes('TransientTransactionError'))
      ) {
        const delay = getRetryDelay(attempt, {
          maxRetries,
          initialRetryDelay,
          maxRetryDelay,
          timeout,
          isolationLevel: 'readCommitted',
          shouldRetry: defaultShouldRetry,
        });
        console.warn(
          `Operation attempt ${attempt + 1}/${maxRetries} failed, retrying in ${Math.round(delay)}ms:`,
          error.message
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error(`Operation failed after ${maxRetries} attempts`);
}

export async function executeTransaction<T>(
  operation: (session: ClientSession) => Promise<T>,
  options: TransactionOptions = {}
): Promise<TransactionResult<T>> {
  try {
    const data = await withTransaction(operation, options);
    return {
      data,
      status: 'success',
    };
  } catch (error) {
    return {
      data: null as unknown as T,
      error: error as Error,
      status: 'error',
    };
  }
}
