import { DB_CONSTANTS } from '@/constants/db';

export interface RetryOptions {
  maxRetries?: number;
  timeout?: number;
  delay?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  timeout: DB_CONSTANTS.QUERY_OPTIONS.DEFAULT_TIMEOUT,
  delay: 1000,
};

class TimeoutError extends Error {
  constructor(timeout: number) {
    super(`Operation timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? DEFAULT_RETRY_OPTIONS.maxRetries;
  const timeout = options.timeout ?? DEFAULT_RETRY_OPTIONS.timeout;
  const delay = options.delay ?? DEFAULT_RETRY_OPTIONS.delay;

  let lastError: Error | null = null;
  let attempt = 0;

  const executeWithTimeout = async (): Promise<T> => {
    let timeoutId: NodeJS.Timeout;
    
    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new TimeoutError(timeout));
          }, timeout);
        }),
      ]);
      
      clearTimeout(timeoutId!);
      return result;
    } catch (error) {
      clearTimeout(timeoutId!);
      throw error;
    }
  };

  while (attempt < maxRetries) {
    try {
      return await executeWithTimeout();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (error instanceof TimeoutError) {
        throw error;
      }

      attempt++;
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
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
