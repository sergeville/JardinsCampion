import { Document } from 'mongoose';

export interface User extends Document {
  id: string;
  name: string;
  email?: string;
  role?: 'user' | 'admin';
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
