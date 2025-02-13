import { ErrorCode, ERROR_METADATA } from './errors/types';

export class VoteError extends Error {
  code: ErrorCode;

  constructor(message: string, code: ErrorCode) {
    super(message);
    this.name = 'VoteError';
    this.code = code;
  }
}

export class DuplicateVoteError extends VoteError {
  constructor(userId: string, logoId: string) {
    super(
      `User ${userId} has already voted for logo ${logoId}`,
      'DUPLICATE_VOTE'
    );
    this.name = 'DuplicateVoteError';
  }
}

export class InvalidVoteError extends VoteError {
  constructor(message: string) {
    super(message, 'INVALID_VOTE');
    this.name = 'InvalidVoteError';
  }
}

export class TransactionError extends VoteError {
  constructor(message: string) {
    super(message, 'TRANSACTION_ERROR');
    this.name = 'TransactionError';
  }
}

export class TimeoutError extends VoteError {
  constructor(timeout: number) {
    super(
      `Operation timed out after ${timeout}ms`,
      'TIMEOUT_ERROR'
    );
    this.name = 'TimeoutError';
  }
}

export class DatabaseError extends VoteError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

interface MongoError extends Error {
  codeName?: string;
}

export function createMongoError(message: string, codeName?: string): MongoError {
  const error = new Error(message) as MongoError;
  error.name = 'MongoError';
  if (codeName) {
    error.codeName = codeName;
  }
  return error;
}

export function isRetryableError(error: Error): boolean {
  if (error instanceof VoteError) {
    const metadata = ERROR_METADATA[error.code];
    return metadata.recoverable;
  }

  if (error.name === 'MongoError') {
    const mongoError = error as MongoError;
    return [
      'WriteConflict',
      'NetworkTimeout',
      'HostUnreachable',
      'HostNotFound',
      'ConnectionTimeout',
    ].includes(mongoError.codeName || '');
  }

  return false;
}
