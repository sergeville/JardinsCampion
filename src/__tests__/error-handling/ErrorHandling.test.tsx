import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ErrorMessage } from '@/components/ErrorMessage';
import { withRetry } from '@/lib/utils';
import { ErrorMetadata, ErrorSeverity, ErrorCategory } from '@/lib/errors/types';

interface ExtendedError extends Error {
  metadata?: ErrorMetadata;
}

describe('Error Handling', () => {
  describe('ErrorMessage Component', () => {
    it('renders error message with icon', () => {
      render(<ErrorMessage error="NETWORK_ERROR" showIcon={true} />);
      expect(screen.getByText('Unable to connect to the server. Please check your internet connection.')).toBeInTheDocument();
      expect(screen.getByText('🌐')).toBeInTheDocument();
    });

    it('hides icon when showIcon is false', () => {
      render(<ErrorMessage error="NETWORK_ERROR" showIcon={false} />);
      expect(screen.getByText('Unable to connect to the server. Please check your internet connection.')).toBeInTheDocument();
      expect(screen.queryByText('🌐')).not.toBeInTheDocument();
    });

    it('shows action button for recoverable errors', () => {
      const mockError = new Error('NETWORK_ERROR') as ExtendedError;
      mockError.metadata = {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.NETWORK,
        userMessage: 'Network error occurred. Please try again.',
        recoverable: true,
        action: {
          handler: jest.fn(),
          label: 'Try Again'
        }
      };
      render(<ErrorMessage error={mockError} showAction={true} />);
      const retryButton = screen.getByRole('button', { name: /Try Again/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('uses default error for unknown error types', () => {
      render(<ErrorMessage error="UNKNOWN_ERROR" />);
      expect(screen.getByText('An unexpected error occurred. Please try again later.')).toBeInTheDocument();
    });

    it('handles custom error metadata', () => {
      const customError = new Error('Custom error');
      const metadata: ErrorMetadata = {
        severity: ErrorSeverity.WARNING,
        category: ErrorCategory.BUSINESS,
        recoverable: true,
        userMessage: 'Custom error message',
        icon: '🔧',
        action: {
          label: 'Fix',
          handler: () => undefined,
        },
      };
      (customError as ExtendedError).metadata = metadata;

      render(<ErrorMessage error={customError} />);
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.getByText('🔧')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Fix' })).toBeInTheDocument();
    });

    it('applies correct severity classes', () => {
      const { container } = render(<ErrorMessage error="NETWORK_ERROR" />);
      expect(container.firstChild).toHaveClass('error');
    });

    it('applies inline class when inline prop is true', () => {
      const { container } = render(<ErrorMessage error="NETWORK_ERROR" inline={true} />);
      expect(container.firstChild).toHaveClass('inline');
    });
  });

  describe('Retry Logic', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should throw error after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Temporary failure'));
      const promise = withRetry(operation, { maxRetries: 2, delay: 100, timeout: 1000 });

      // First attempt
      await Promise.resolve();
      jest.advanceTimersByTime(1000); // Advance past timeout
      await Promise.resolve();

      // First retry (after delay)
      jest.advanceTimersByTime(100); // Advance past delay
      await Promise.resolve();
      jest.advanceTimersByTime(1000); // Advance past timeout
      await Promise.resolve();

      await expect(promise).rejects.toThrow('Temporary failure');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should respect timeout option', async () => {
      const operation = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const promise = withRetry(operation, { maxRetries: 1, delay: 0, timeout: 50 });

      // Advance timers to trigger timeout
      await Promise.resolve();
      jest.advanceTimersByTime(50);
      await Promise.resolve();

      await expect(promise).rejects.toThrow('Operation timed out after 50ms');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should succeed on retry after temporary failure', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce('success');

      const promise = withRetry(operation, { maxRetries: 2, delay: 100, timeout: 1000 });

      // First attempt fails
      await Promise.resolve();
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // Retry succeeds after delay
      jest.advanceTimersByTime(100);
      await Promise.resolve();
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      await expect(promise).resolves.toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });
});
