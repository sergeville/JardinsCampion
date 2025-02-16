import { networkRequest, NetworkError } from '../utils/networkManager';
import { jwtDecode } from 'jwt-decode';
import { AuthError } from '@/lib/errors/types';

// Token refresh settings
const TOKEN_REFRESH_THRESHOLD = 5 * 60; // Refresh token if less than 5 minutes until expiry
const TOKEN_CHECK_INTERVAL = 60 * 1000; // Check token every minute

export type AuthErrorType =
  | 'invalid_credentials'
  | 'token_expired'
  | 'network_error'
  | 'unauthorized';

interface TokenPayload {
  sub: string;
  name: string;
  exp: number;
  iat: number;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: {
    id: string;
    name: string;
  } | null;
}

interface AuthEventListener {
  onAuthStateChange?: (state: AuthState) => void;
  onError?: (error: Error) => void;
  onTokenRefresh?: (tokens: AuthTokens) => void;
}

// Request queue type
interface QueuedRequest<T> {
  request: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (error: unknown) => void;
}

interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
}

interface TokenValidationResponse {
  valid: boolean;
  error?: string;
}

interface TokenVerificationResponse {
  valid: boolean;
  error?: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  error?: string;
}

interface RefreshResponse {
  accessToken: string;
  error?: string;
}

interface RequestError extends Error {
  status?: number;
  response?: Response;
}

class AuthManager {
  private static instance: AuthManager;
  private accessToken: string | null = null;
  private refreshPromise: Promise<void> | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: AuthEventListener[] = [];
  private requestQueue: Array<QueuedRequest<unknown>> = [];
  private isRefreshing = false;
  private csrfToken: string | null = null;

  private state: AuthState = {
    isAuthenticated: false,
    isLoading: true,
    error: null,
    user: null,
  };

  private constructor() {
    // Initialize from memory only for access token
    this.accessToken = null;

    // Start token check interval
    this.startTokenCheck();

    // Initialize CSRF token
    this.initializeCsrfToken();
  }

  private async initializeCsrfToken() {
    if (typeof window === 'undefined') return;

    try {
      const baseUrl = window.location.origin || '';
      const response = await fetch(`${baseUrl}/api/auth/csrf`, {
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const { token } = await response.json();
        this.csrfToken = token;
      }
    } catch (error) {
      console.error('Failed to initialize CSRF token:', error);
    }
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private setState(newState: Partial<AuthState>) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      if (listener.onAuthStateChange) {
        listener.onAuthStateChange(this.state);
      }
    });
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push({ onAuthStateChange: listener });
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l.onAuthStateChange !== listener);
    };
  }

  private async validateToken(token: string): Promise<boolean> {
    try {
      const payload = jwtDecode<TokenPayload>(token);
      const now = Math.floor(Date.now() / 1000);

      if (!payload.sub || !payload.name || payload.exp <= now || payload.iat >= now) {
        throw new AuthError('Invalid token payload', 'invalid_token');
      }

      // Verify token with backend
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.csrfToken || '',
        },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new AuthError('Token verification failed', 'invalid_token');
      }

      return true;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        'Token validation failed',
        'invalid_token',
        error instanceof Error ? error : undefined
      );
    }
  }

  private async validateAndUpdateState(): Promise<boolean> {
    if (!this.accessToken) {
      this.setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
      return false;
    }

    try {
      const payload = jwtDecode<TokenPayload>(this.accessToken);
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp <= now) {
        throw new AuthError('Token expired', 'token_expired');
      }

      await this.validateToken(this.accessToken);

      this.setState({
        isAuthenticated: true,
        user: {
          id: payload.sub,
          name: payload.name,
        },
        isLoading: false,
        error: null,
      });

      if (payload.exp - now <= TOKEN_REFRESH_THRESHOLD) {
        await this.refreshToken();
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      this.setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: error instanceof AuthError ? error.message : 'Invalid token',
      });
      return false;
    }
  }

  private async executeQueuedRequests() {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const { request, resolve, reject } of queue) {
      try {
        const result = await request();
        resolve(result);
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  private async refreshToken(): Promise<void> {
    if (this.isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        this.requestQueue.push({
          request: () => this.refreshToken(),
          resolve: resolve as (value: unknown) => void,
          reject,
        });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await networkRequest.standard(() =>
        fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.csrfToken || '',
          },
          credentials: 'include',
        }).then((res) => {
          if (!res.ok) {
            throw new AuthError('Refresh failed', 'token_expired');
          }
          return res.json();
        })
      );

      if (response.accessToken) {
        this.accessToken = response.accessToken;
        await this.validateAndUpdateState();
      } else {
        throw new AuthError('Invalid refresh token response', 'invalid_token');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      throw error;
    } finally {
      this.isRefreshing = false;
      this.executeQueuedRequests();
    }
  }

  public async login(credentials: { username: string; password: string }): Promise<void> {
    this.setState({ isLoading: true, error: null });

    try {
      const response = await networkRequest.standard(() =>
        fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.csrfToken || '',
          },
          credentials: 'include',
          body: JSON.stringify(credentials),
        }).then((res) => {
          if (!res.ok) {
            if (res.status === 401) {
              throw new AuthError('Invalid credentials', 'invalid_credentials');
            }
            throw new NetworkError('Login request failed', res.status);
          }
          return res.json();
        })
      );

      if (response.accessToken) {
        this.accessToken = response.accessToken;
        await this.validateAndUpdateState();
      } else {
        throw new AuthError('Invalid login response', 'invalid_credentials');
      }
    } catch (error) {
      console.error('Login failed:', error);
      this.setState({
        isLoading: false,
        error:
          error instanceof AuthError
            ? error.message
            : error instanceof NetworkError
              ? `Login failed: ${error.message}`
              : 'Login failed. Please try again.',
      });
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        error instanceof NetworkError ? error.message : 'Login failed',
        'network_error',
        error instanceof Error ? error : undefined
      );
    }
  }

  public async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': this.csrfToken || '',
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    }

    this.accessToken = null;
    this.setState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public async getValidToken(): Promise<string> {
    if (typeof window === 'undefined') {
      throw new AuthError('Cannot get token during SSR', 'unauthorized');
    }

    if (!this.accessToken) {
      throw new AuthError('No access token available', 'unauthorized');
    }

    try {
      const payload = jwtDecode<TokenPayload>(this.accessToken);
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp - now <= TOKEN_REFRESH_THRESHOLD) {
        await this.refreshToken();
      }

      if (!this.accessToken) {
        throw new AuthError('Token refresh failed', 'token_expired');
      }

      return this.accessToken;
    } catch (error) {
      this.setState({
        isAuthenticated: false,
        user: null,
        error: 'Session expired',
      });
      throw new AuthError(
        'Invalid or expired token',
        'token_expired',
        error instanceof Error ? error : undefined
      );
    }
  }

  public isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  public getCurrentUser() {
    return this.state.user;
  }

  public getAuthState(): AuthState {
    return this.state;
  }

  private startTokenCheck() {
    // Clear any existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Set up new interval
    this.checkInterval = setInterval(() => {
      this.validateAndUpdateState().catch((error) => {
        console.error('Token validation error:', error);
      });
    }, TOKEN_CHECK_INTERVAL);
  }

  private notifyTokenRefresh(tokens: AuthTokens): void {
    this.listeners.forEach((listener) => {
      if (listener.onTokenRefresh) {
        listener.onTokenRefresh(tokens);
      }
    });
  }

  private handleError(message: string, type: AuthErrorType, originalError?: Error): void {
    const error = new AuthError(message, type, originalError);
    this.setState({ error: error.message, isAuthenticated: false, user: null });

    this.listeners.forEach((listener) => {
      if (listener.onError) {
        listener.onError(error);
      }
    });
  }

  public addListener(listener: AuthEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // For testing purposes only
  public __test_setState(newState: Partial<AuthState>): void {
    this.setState(newState);
  }

  // Create a safe fetch wrapper
  private async safeFetch(url: string, options?: RequestInit): Promise<Response> {
    if (typeof window === 'undefined') {
      throw new Error('Cannot make fetch calls during SSR');
    }

    const baseUrl = window.location.origin || '';
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

    return fetch(fullUrl, {
      ...options,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {}),
        ...(options?.headers || {}),
      },
    });
  }
}

export const authManager = AuthManager.getInstance();

// Create an authenticated fetch utility
export async function authenticatedFetch(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  const authManager = AuthManager.getInstance();

  if (!authManager.isAuthenticated()) {
    throw new Error('Not authenticated');
  }

  try {
    const token = await authManager.getValidToken();
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${token}`);

    return fetch(input, { ...init, headers });
  } catch (error) {
    if (error instanceof Error && error.message === 'Token refresh required') {
      return new Promise<Response>((resolve, reject) => {
        const authManager = AuthManager.getInstance();
        authManager['requestQueue'].push({
          request: () => authenticatedFetch(input, init),
          resolve: resolve as (value: unknown) => void,
          reject,
        });
      });
    }
    throw error;
  }
}
