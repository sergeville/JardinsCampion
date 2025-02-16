import { DB_CONSTANTS } from '@/constants/db';

export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  timeout?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  timeout: DB_CONSTANTS.QUERY_OPTIONS.DEFAULT_TIMEOUT,
  delay: 2000,
};

class TimeoutError extends Error {
  constructor(timeout: number) {
    super(`Operation timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetriesOrOptions: number | RetryOptions = 3
): Promise<T> {
  const options =
    typeof maxRetriesOrOptions === 'number'
      ? { maxRetries: maxRetriesOrOptions }
      : maxRetriesOrOptions;

  const { maxRetries = 3, delay = 2000 } = options;
  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;

      if (attempt < maxRetries) {
        const backoffDelay = delay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

export async function executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error('Operation timed out'));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle!);
    throw error;
  }
}

export function validateVoteData(data: Record<string, unknown>): boolean {
  if (!data || typeof data !== 'object') return false;
  if (!data.userId || !data.logoId) return false;
  if (typeof data.userId !== 'string' || typeof data.logoId !== 'string') return false;
  if (data.ownerId && typeof data.ownerId !== 'string') return false;
  return true;
}

export const queryOptions = {
  maxTimeMS: DB_CONSTANTS.QUERY_OPTIONS.DEFAULT_TIMEOUT,
  lean: true,
};
