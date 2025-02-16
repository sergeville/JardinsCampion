import React from 'react';
import { render, screen } from '@testing-library/react';
import DatabaseErrorBoundary from '@/components/DatabaseErrorBoundary';
import { DatabaseError, ErrorSeverity, ErrorCategory } from '@/lib/errors/types';

// Mock console.error to prevent error logging during tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('DatabaseErrorBoundary', () => {
  const ErrorComponent = () => {
    throw new DatabaseError('Test database error', {
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.DATABASE,
      userMessage: 'A test database error occurred',
      recoverable: true,
      icon: '🔴',
      action: {
        label: 'Retry',
        handler: () => undefined,
      },
    });
  };

  it('renders children when there is no error', () => {
    render(
      <DatabaseErrorBoundary>
        <div data-testid="child">Test Child</div>
      </DatabaseErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders error message when there is an error', () => {
    const onError = jest.fn();

    render(
      <DatabaseErrorBoundary onError={onError}>
        <ErrorComponent />
      </DatabaseErrorBoundary>
    );

    expect(screen.getByText('A test database error occurred')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
  });

  it('renders custom fallback when provided and error occurs', () => {
    const fallback = <div data-testid="fallback">Custom Fallback</div>;

    render(
      <DatabaseErrorBoundary fallback={fallback}>
        <ErrorComponent />
      </DatabaseErrorBoundary>
    );

    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('calls onError prop when error occurs', () => {
    const onError = jest.fn();

    render(
      <DatabaseErrorBoundary onError={onError}>
        <ErrorComponent />
      </DatabaseErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(DatabaseError),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('logs error information to console', () => {
    render(
      <DatabaseErrorBoundary>
        <ErrorComponent />
      </DatabaseErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith('Database Error:', expect.any(DatabaseError));
    expect(console.error).toHaveBeenCalledWith('Error Info:', expect.any(Object));
  });

  it('applies correct CSS classes', () => {
    render(
      <DatabaseErrorBoundary>
        <ErrorComponent />
      </DatabaseErrorBoundary>
    );

    const errorContainer = screen.getByRole('generic');
    expect(errorContainer).toHaveClass('errorContainer');
  });
});
