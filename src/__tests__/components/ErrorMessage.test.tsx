import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage from '@/components/ErrorMessage';
import {
  DatabaseError,
  NetworkError,
  ValidationError,
  ErrorSeverity,
  ErrorCategory,
} from '@/lib/errors/types';

describe('ErrorMessage', () => {
  it('renders string error message', () => {
    render(<ErrorMessage error="Test error message" />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders user message', () => {
    render(<ErrorMessage error="User message" isUserMessage={true} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('User message')).toBeInTheDocument();
    expect(screen.getByText('💬')).toBeInTheDocument();
  });

  it('renders DatabaseError with metadata', () => {
    const handleAction = jest.fn();
    const error = new DatabaseError('Database connection failed', {
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.DATABASE,
      userMessage: 'Database is currently unavailable',
      recoverable: true,
      icon: '🔴',
      action: {
        label: 'Retry Connection',
        handler: handleAction,
      },
    });

    render(<ErrorMessage error={error} />);
    expect(screen.getByText('Database is currently unavailable')).toBeInTheDocument();
    expect(screen.getByText('🔴')).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: 'Retry Connection' });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(handleAction).toHaveBeenCalled();
  });

  it('renders NetworkError with metadata', () => {
    const handleAction = jest.fn();
    const error = new NetworkError('Network request failed', {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.NETWORK,
      userMessage: 'Unable to connect to server',
      recoverable: true,
      icon: '🌐',
      action: {
        label: 'Retry',
        handler: handleAction,
      },
    });

    render(<ErrorMessage error={error} />);
    expect(screen.getByText('Unable to connect to server')).toBeInTheDocument();
    expect(screen.getByText('🌐')).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: 'Retry' });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(handleAction).toHaveBeenCalled();
  });

  it('renders ValidationError with metadata', () => {
    const error = new ValidationError('Invalid input', {
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.VALIDATION,
      userMessage: 'Please check your input',
      recoverable: true,
      icon: '⚠️',
    });

    render(<ErrorMessage error={error} />);
    expect(screen.getByText('Please check your input')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('applies inline class when inline prop is true', () => {
    render(<ErrorMessage error="Test error" inline={true} />);
    expect(screen.getByRole('alert')).toHaveClass('inline');
  });

  it('applies severity-based classes', () => {
    const error = new DatabaseError('Test error', {
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.DATABASE,
      userMessage: 'Test message',
      recoverable: true,
    });

    render(<ErrorMessage error={error} />);
    expect(screen.getByRole('alert')).toHaveClass('critical');
  });

  it('hides icon when showIcon is false', () => {
    const error = new DatabaseError('Test error', {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.DATABASE,
      userMessage: 'Test message',
      recoverable: true,
      icon: '🔴',
    });

    render(<ErrorMessage error={error} showIcon={false} />);
    expect(screen.queryByText('🔴')).not.toBeInTheDocument();
  });

  it('hides action when showAction is false', () => {
    const error = new DatabaseError('Test error', {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.DATABASE,
      userMessage: 'Test message',
      recoverable: true,
      action: {
        label: 'Retry',
        handler: jest.fn(),
      },
    });

    render(<ErrorMessage error={error} showAction={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ErrorMessage error="Test error" className="custom-class" />);
    expect(screen.getByRole('alert')).toHaveClass('custom-class');
  });
});
