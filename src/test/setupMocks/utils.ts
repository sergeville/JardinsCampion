export const executeWithTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
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
};

export const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
};
