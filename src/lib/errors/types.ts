import React from 'react';

export enum ErrorSeverity {
  FATAL = 'fatal',
  CRITICAL = 'critical',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

export enum ErrorCategory {
  SYSTEM = 'system',
  DATABASE = 'database',
  NETWORK = 'network',
  VALIDATION = 'validation',
  BUSINESS = 'business',
}

export interface ErrorMetadata {
  severity: ErrorSeverity;
  category: ErrorCategory;
  recoverable: boolean;
  userMessage: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    handler: () => void;
  };
}

export type ErrorCode =
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'TIMEOUT_ERROR'
  | 'DUPLICATE_VOTE'
  | 'INVALID_VOTE'
  | 'TRANSACTION_ERROR'
  | 'DEFAULT_ERROR';

export const ERROR_METADATA: Record<ErrorCode, ErrorMetadata> = {
  NETWORK_ERROR: {
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.NETWORK,
    recoverable: true,
    userMessage: 'Unable to connect to the server. Please check your internet connection.',
    icon: '🌐',
    action: {
      label: 'Retry',
      handler: () => window.location.reload(),
    },
  },
  API_ERROR: {
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.SYSTEM,
    recoverable: true,
    userMessage: 'The server encountered an error. Please try again later.',
    icon: '⚠️',
    action: {
      label: 'Retry',
      handler: () => window.location.reload(),
    },
  },
  VALIDATION_ERROR: {
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.VALIDATION,
    recoverable: true,
    userMessage: 'Please check your input and try again.',
    icon: '❗',
  },
  DATABASE_ERROR: {
    severity: ErrorSeverity.CRITICAL,
    category: ErrorCategory.DATABASE,
    recoverable: false,
    userMessage: 'A database error occurred. Please try again later.',
    icon: '🔴',
  },
  TIMEOUT_ERROR: {
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.NETWORK,
    recoverable: true,
    userMessage: 'The request timed out. Please try again.',
    icon: '⏱️',
    action: {
      label: 'Retry',
      handler: () => window.location.reload(),
    },
  },
  DUPLICATE_VOTE: {
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.BUSINESS,
    recoverable: true,
    userMessage: 'You have already voted for this logo.',
    icon: '✋',
  },
  INVALID_VOTE: {
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.VALIDATION,
    recoverable: true,
    userMessage: 'This vote is not valid. Please try again.',
    icon: '⚠️',
  },
  TRANSACTION_ERROR: {
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.DATABASE,
    recoverable: true,
    userMessage: 'Failed to process your vote. Please try again.',
    icon: '❌',
    action: {
      label: 'Retry',
      handler: () => window.location.reload(),
    },
  },
  DEFAULT_ERROR: {
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.SYSTEM,
    recoverable: false,
    userMessage: 'An unexpected error occurred. Please try again later.',
    icon: '⚠️',
  },
};
