import { Document } from 'mongoose';

export interface User extends Document {
  userId: string;
  name: string;
  voteCount: number;
  votedLogos: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  error: string | null;
  isLoading: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface TokenPayload {
  sub: string;
  name: string;
  exp: number;
  iat: number;
}

export type AuthErrorType =
  | 'invalid_credentials'
  | 'token_expired'
  | 'network_error'
  | 'unauthorized'
  | 'invalid_token';
