import { executeWithTimeout } from '../utils';

// Network request timeouts
const DEFAULT_TIMEOUT = 5000; // 5 seconds
const EXTENDED_TIMEOUT = 10000; // 10 seconds for larger operations
const QUICK_TIMEOUT = 3000; // 3 seconds for quick operations

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 5000; // 5 seconds

interface RequestError extends Error {
  statusCode?: number;
  isTimeout?: boolean;
  errorLabels?: string[];
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly isTimeout?: boolean,
    public readonly attempt?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

interface RequestOptions {
  timeout?: number;
  maxRetries?: number;
  retryableStatuses?: number[];
  shouldRetry?: (error: RequestError) => boolean;
  onRetry?: (error: RequestError, attempt: number) => void;
}

function isRetryableError(error: RequestError, options?: RequestOptions): boolean {
  // Network-level errors
  if (!error.statusCode) {
    return true;
  }

  // Specific HTTP status codes that are retryable
  const retryableStatuses = options?.retryableStatuses || [
    408, // Request Timeout
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
  ];

  return retryableStatuses.includes(error.statusCode);
}

function getRetryDelay(attempt: number): number {
  const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt), MAX_RETRY_DELAY);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * (delay * 0.1);
}

export async function withNetwork<T>(
  operation: () => Promise<T>,
  options: RequestOptions = {}
): Promise<T> {
  const {
    timeout = DEFAULT_TIMEOUT,
    maxRetries = MAX_RETRIES,
    shouldRetry = isRetryableError,
    onRetry,
  } = options;

  let attempt = 0;
  let lastError: Error | undefined;

  while (attempt < maxRetries) {
    try {
      return await executeWithTimeout(operation(), timeout);
    } catch (error: any) {
      lastError = error;

      // Check if we should retry
      if (attempt < maxRetries - 1 && shouldRetry(error as RequestError, options)) {
        const delay = getRetryDelay(attempt);

        onRetry?.(error as RequestError, attempt + 1);

        console.warn(
          `Request attempt ${attempt + 1}/${maxRetries} failed, retrying in ${Math.round(delay)}ms:`,
          error.message
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
        continue;
      }

      // If we shouldn't retry, wrap the error
      throw new NetworkError(
        error.message || 'Network request failed',
        error.statusCode,
        error.isTimeout,
        attempt + 1,
        error
      );
    }
  }

  throw new NetworkError(
    `Request failed after ${maxRetries} attempts`,
    undefined,
    false,
    maxRetries,
    lastError
  );
}

// Specialized request functions with appropriate timeouts
export const networkRequest = {
  quick: <T>(operation: () => Promise<T>, options?: RequestOptions) =>
    withNetwork(operation, { ...options, timeout: QUICK_TIMEOUT }),

  standard: <T>(operation: () => Promise<T>, options?: RequestOptions) =>
    withNetwork(operation, { ...options, timeout: DEFAULT_TIMEOUT }),

  extended: <T>(operation: () => Promise<T>, options?: RequestOptions) =>
    withNetwork(operation, { ...options, timeout: EXTENDED_TIMEOUT }),
};

interface NetworkResponse<T> {
  data: T;
  error?: Error;
  status: number;
  headers?: Headers;
}

interface RetryOptions {
  maxRetries?: number;
  initialRetryDelay?: number;
  maxRetryDelay?: number;
  shouldRetry?: (error: Error, options: RetryOptions) => boolean;
}

export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit & RetryOptions = {}
): Promise<NetworkResponse<T>> {
  const {
    maxRetries = 3,
    initialRetryDelay = 1000,
    maxRetryDelay = 5000,
    shouldRetry = (error: Error) => error instanceof NetworkError,
    ...fetchOptions
  } = options;

  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, fetchOptions);
      if (!response.ok) {
        throw new NetworkError('Network request failed', response.status);
      }
      const data = (await response.json()) as T;
      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      if (error instanceof Error && attempt < maxRetries - 1 && shouldRetry(error, options)) {
        const delay = Math.min(initialRetryDelay * Math.pow(2, attempt), maxRetryDelay);
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
        continue;
      }
      throw error;
    }
  }

  throw new NetworkError(`Request failed after ${maxRetries} attempts`);
}

export async function handleNetworkError(error: Error, options: RetryOptions = {}): Promise<void> {
  console.error('Network error:', error);
  // Add any additional error handling logic here
}
