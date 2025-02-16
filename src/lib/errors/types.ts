import React from 'react';

export type AuthErrorType =
  | 'invalid_credentials'
  | 'token_expired'
  | 'network_error'
  | 'unauthorized'
  | 'invalid_token';

export type ErrorCode =
  | 'DUPLICATE_VOTE'
  | 'INVALID_VOTE'
  | 'TRANSACTION_ERROR'
  | 'TIMEOUT_ERROR'
  | 'DATABASE_ERROR';

export enum ErrorSeverity {
  FATAL = 'FATAL',
  CRITICAL = 'CRITICAL',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

export enum ErrorCategory {
  SYSTEM = 'SYSTEM',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
}

export interface ErrorAction {
  label: string;
  handler: () => void;
}

export interface ErrorMetadata {
  severity: ErrorSeverity;
  category: ErrorCategory;
  recoverable: boolean;
  userMessage?: string;
  icon?: string;
  action?: ErrorAction;
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly metadata: ErrorMetadata
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly metadata: ErrorMetadata
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly metadata: ErrorMetadata
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly type: AuthErrorType,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const ERROR_METADATA = {
  DATABASE_ERROR: {
    severity: ErrorSeverity.CRITICAL,
    category: ErrorCategory.DATABASE,
    recoverable: true,
    icon: '🔴',
    action: {
      label: 'Retry',
      handler: () => window.location.reload(),
    },
  },
  NETWORK_ERROR: {
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.NETWORK,
    recoverable: true,
    icon: '🌐',
    action: {
      label: 'Retry',
      handler: () => window.location.reload(),
    },
  },
  VALIDATION_ERROR: {
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.VALIDATION,
    recoverable: true,
    icon: '⚠️',
  },
  AUTH_ERROR: {
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.AUTHENTICATION,
    recoverable: true,
    icon: '🔒',
    action: {
      label: 'Log In',
      handler: () => (window.location.href = '/login'),
    },
  },
  DEFAULT_ERROR: {
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.SYSTEM,
    recoverable: false,
    icon: '❌',
  },
  DUPLICATE_VOTE: {
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.VALIDATION,
    recoverable: true,
    icon: '⚠️',
  },
  INVALID_VOTE: {
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.VALIDATION,
    recoverable: true,
    icon: '⚠️',
  },
  TRANSACTION_ERROR: {
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.DATABASE,
    recoverable: true,
    icon: '🔴',
  },
  TIMEOUT_ERROR: {
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.NETWORK,
    recoverable: true,
    icon: '🌐',
  },
};
