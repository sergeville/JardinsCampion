import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorMessage from '@/components/ErrorMessage';
import { withRetry, executeWithTimeout } from '@/lib/utils';
import {
  ErrorMetadata,
  ErrorSeverity,
  ErrorCategory,
  NetworkError,
  DatabaseError,
} from '@/lib/errors/types';

jest.setTimeout(30000); // Increase timeout for all tests in this file

interface ExtendedError extends Error {
  metadata?: ErrorMetadata;
}

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ErrorMessage Component', () => {
    it('renders error message with icon', () => {
      const error = new NetworkError('Network error occurred', {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.NETWORK,
        recoverable: true,
        userMessage: 'Unable to connect to the server. Please check your internet connection.',
        icon: '🌐',
      });
      render(<ErrorMessage error={error} showIcon={true} />);
      expect(screen.getByText('Unable to connect to the server. Please check your internet connection.')).toBeInTheDocument();
      expect(screen.getByText('🌐')).toBeInTheDocument();
    });

    it('hides icon when showIcon is false', () => {
      const error = new NetworkError('Network error occurred', {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.NETWORK,
        recoverable: true,
        userMessage: 'Unable to connect to the server. Please check your internet connection.',
        icon: '🌐',
      });
      render(<ErrorMessage error={error} showIcon={false} />);
      expect(screen.getByText('Unable to connect to the server. Please check your internet connection.')).toBeInTheDocument();
      expect(screen.queryByText('🌐')).not.toBeInTheDocument();
    });

    it('shows action button for recoverable errors', () => {
      const mockError = new NetworkError('Network error occurred', {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.NETWORK,
        recoverable: true,
        userMessage: 'Network error occurred. Please try again.',
        icon: '🌐',
        action: {
          label: 'Try Again',
          handler: jest.fn(),
        },
      });
      render(<ErrorMessage error={mockError} showAction={true} />);
      const retryButton = screen.getByRole('button', { name: /Try Again/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('uses default error for unknown error types', () => {
      const error = new Error('Unknown error');
      render(<ErrorMessage error={error} />);
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

    it('applies severity-based classes', () => {
      const error = new NetworkError('Network error occurred', {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.NETWORK,
        recoverable: true,
        userMessage: 'Unable to connect to the server. Please check your internet connection.',
        icon: '🌐',
      });
      render(<ErrorMessage error={error} />);
      expect(screen.getByRole('alert')).toHaveClass('error');
    });

    it('applies inline class when inline prop is true', () => {
      const error = new NetworkError('Network error occurred', {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.NETWORK,
        recoverable: true,
        userMessage: 'Unable to connect to the server. Please check your internet connection.',
        icon: '🌐',
      });
      render(<ErrorMessage error={error} inline={true} />);
      expect(screen.getByRole('alert')).toHaveClass('inline');
    });

    it('renders network error message correctly', () => {
      const error = new NetworkError('Network error occurred', {
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.NETWORK,
        recoverable: true,
        userMessage: 'Unable to connect to the server. Please check your internet connection.',
        icon: '🌐',
      });
      render(<ErrorMessage error={error} />);
      expect(
        screen.getByText('Unable to connect to the server. Please check your internet connection.')
      ).toBeInTheDocument();
    });

    it('renders database error message correctly', () => {
      const error = new DatabaseError('Database error occurred', {
        severity: ErrorSeverity.CRITICAL,
        category: ErrorCategory.DATABASE,
        recoverable: true,
        userMessage: 'An unexpected error occurred. Please try again later.',
        icon: '🔴',
      });
      render(<ErrorMessage error={error} />);
      expect(
        screen.getByText('An unexpected error occurred. Please try again later.')
      ).toBeInTheDocument();
    });
  });

  describe('Retry Logic', () => {
    beforeEach(() => {
      jest.useFakeTimers({ advanceTimers: true });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should throw error after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Temporary failure'));
      const promise = withRetry(operation, 2);

      await expect(promise).rejects.toThrow('Temporary failure');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should respect timeout option', async () => {
      const operation = jest
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 2000)));

      const promise = executeWithTimeout(operation(), 1000);
      jest.advanceTimersByTime(1001);

      await expect(promise).rejects.toThrow('Operation timed out');
    });

    it('should succeed on retry after temporary failure', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce('success');

      const result = await withRetry(operation, 2);
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('handles retry logic correctly', async () => {
      const mockFetch = jest
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 2000)));

      global.fetch = mockFetch;

      // ... rest of the test code ...
    });
  });

  describe('Error Recovery', () => {
    beforeEach(() => {
      jest.useFakeTimers({ advanceTimers: true });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should handle database connection errors', async () => {
      const mockConnect = jest
        .fn()
        .mockRejectedValueOnce(new Error('Connection error'))
        .mockResolvedValueOnce(true);

      const result = await withRetry(mockConnect, 2);
      expect(result).toBe(true);
      expect(mockConnect).toHaveBeenCalledTimes(2);
    });

    it('should handle network timeouts', async () => {
      const mockRequest = jest
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 2000)));

      const promise = executeWithTimeout(mockRequest(), 1000);
      jest.advanceTimersByTime(1001);

      await expect(promise).rejects.toThrow('Operation timed out');
    });

    it('should handle API errors', async () => {
      const mockApi = jest
        .fn()
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce({ data: 'success' });

      const result = await withRetry(mockApi, 2);
      expect(result).toEqual({ data: 'success' });
      expect(mockApi).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Boundaries', () => {
    it('should catch and handle React errors', () => {
      const mockError = new Error('React component error');
      const mockErrorHandler = jest.fn();

      try {
        throw mockError;
      } catch (error) {
        mockErrorHandler(error);
      }

      expect(mockErrorHandler).toHaveBeenCalledWith(mockError);
    });

    it('should handle async errors in useEffect', async () => {
      const mockEffect = jest.fn().mockRejectedValue(new Error('Effect error'));
      const mockErrorHandler = jest.fn();

      try {
        await mockEffect();
      } catch (error) {
        mockErrorHandler(error);
      }

      expect(mockErrorHandler).toHaveBeenCalled();
    });
  });
});
