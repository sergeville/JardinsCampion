import { authManager } from '@/lib/auth/authManager';
import { AuthError } from '@/lib/errors/types';
import { NetworkError } from '@/lib/utils/networkManager';
import { AuthManager } from '@/lib/auth/authManager';

// Setup fetch polyfill
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Create a proper Headers mock
const mockHeadersProto = {
  append: jest.fn(),
  delete: jest.fn(),
  get: jest.fn(),
  has: jest.fn(),
  set: jest.fn(),
  forEach: jest.fn(),
  entries: jest.fn(() => [][Symbol.iterator]()),
  keys: jest.fn(() => [][Symbol.iterator]()),
  values: jest.fn(() => [][Symbol.iterator]()),
  [Symbol.iterator]: jest.fn(() => [][Symbol.iterator]()),
  getSetCookie: jest.fn(() => []),
};

global.Headers = jest.fn().mockImplementation(() => Object.create(mockHeadersProto));

// Add type definition at the top
interface QueuedRequest {
  request: () => Promise<Response>;
  resolve: (value: Response) => void;
  reject: (error: Error) => void;
}

// Mock authenticatedFetch
const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(options.headers);
  if (authManager['accessToken']) {
    headers.set('Authorization', `Bearer ${authManager['accessToken']}`);
  }
  if (authManager['csrfToken']) {
    headers.set('X-CSRF-Token', authManager['csrfToken']);
  }

  if (authManager['isRefreshing']) {
    return new Promise<Response>((resolve, reject) => {
      (authManager['requestQueue'] as QueuedRequest[]).push({
        request: () => authenticatedFetch(url, { ...options, headers }),
        resolve,
        reject,
      });
    });
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response && !response.ok && response.status === 401) {
    try {
      await authManager['refreshToken']();
      return authenticatedFetch(url, options);
    } catch (error) {
      throw new AuthError(
        'Authentication failed',
        'unauthorized',
        error instanceof Error ? error : undefined
      );
    }
  }

  if (!response || !response.ok) {
    throw new NetworkError('Request failed', response?.status);
  }

  return response;
};

// Mock jwt-decode
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn((token: string) => {
    if (token === 'valid.jwt.token') {
      return {
        sub: 'user123',
        name: 'Test User',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000) - 100, // issued 100 seconds ago
      };
    }
    throw new Error('Invalid token');
  }),
}));

describe('AuthManager', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    // Reset authManager state
    authManager['accessToken'] = null;
    authManager['csrfToken'] = null;
    authManager['isRefreshing'] = false;
    authManager['requestQueue'] = [];
    authManager.__test_setState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      user: null,
    });

    // Default mock implementation for fetch
    mockFetch.mockImplementation((url) => {
      const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
      switch (fullUrl) {
        case 'http://localhost/api/auth/csrf':
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ token: 'csrf-token' }),
          });
        case 'http://localhost/api/auth/verify':
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ valid: true }),
          });
        case 'http://localhost/api/auth/refresh':
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ accessToken: 'new.valid.token' }),
          });
        case 'http://localhost/api/auth/logout':
          return Promise.resolve({ ok: true });
        case 'http://localhost/api/auth/login':
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ accessToken: 'valid.jwt.token' }),
          });
        default:
          return Promise.reject(new Error('Unexpected request to ' + fullUrl));
      }
    });
  });

  describe('Initialization', () => {
    beforeEach(() => {
      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost',
        },
        writable: true,
      });
    });

    it('should initialize CSRF token on creation', async () => {
      await authManager['initializeCsrfToken']();
      expect(authManager['csrfToken']).toBe('csrf-token');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost/api/auth/csrf',
        expect.objectContaining({
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should handle CSRF token initialization failure gracefully', async () => {
      mockFetch.mockReset();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await authManager['initializeCsrfToken']();
      expect(authManager['csrfToken']).toBeNull();
    });
  });

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      // Override default mock for login request
      mockFetch.mockImplementation((url) => {
        switch (url) {
          case '/api/auth/login':
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ accessToken: 'valid.jwt.token' }),
            });
          case '/api/auth/verify':
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ valid: true }),
            });
          case '/api/auth/csrf':
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ token: 'csrf-token' }),
            });
          default:
            return Promise.reject(new Error('Unexpected request to ' + url));
        }
      });

      await authManager.login({ username: 'test', password: 'password' });

      expect(authManager.isAuthenticated()).toBe(true);
      expect(authManager.getCurrentUser()).toEqual({
        id: 'user123',
        name: 'Test User',
      });
    });

    it('should handle invalid credentials', async () => {
      // Override default mock for login request
      mockFetch.mockImplementation((url) => {
        switch (url) {
          case '/api/auth/login':
            return Promise.resolve({
              ok: false,
              status: 401,
              json: () => Promise.resolve({ error: 'Invalid credentials' }),
            });
          case '/api/auth/csrf':
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ token: 'csrf-token' }),
            });
          default:
            return Promise.reject(new Error('Unexpected request to ' + url));
        }
      });

      await expect(authManager.login({ username: 'test', password: 'wrong' })).rejects.toThrow(
        AuthError
      );

      expect(authManager.isAuthenticated()).toBe(false);
      expect(authManager.getCurrentUser()).toBeNull();
    });

    it('should handle network errors during login', async () => {
      // Override default mock for login request
      mockFetch.mockImplementation((url) => {
        switch (url) {
          case '/api/auth/login':
            throw new NetworkError('Connection failed', 500);
          case '/api/auth/csrf':
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ token: 'csrf-token' }),
            });
          default:
            return Promise.reject(new Error('Unexpected request to ' + url));
        }
      });

      await expect(authManager.login({ username: 'test', password: 'password' })).rejects.toThrow(
        'Connection failed'
      );

      expect(authManager.isAuthenticated()).toBe(false);
    });
  });

  describe('Token Management', () => {
    beforeEach(() => {
      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost',
        },
        writable: true,
      });
    });

    it('should validate tokens correctly', async () => {
      // Mock fetch for token verification
      mockFetch.mockImplementationOnce((url) => {
        if (url === '/api/auth/verify') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ valid: true }),
          });
        }
        return Promise.reject(new Error('Unexpected request to ' + url));
      });

      const isValid = await authManager['validateToken']('valid.jwt.token');
      expect(isValid).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/verify',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-CSRF-Token': '',
          }),
          credentials: 'include',
          body: JSON.stringify({ token: 'valid.jwt.token' }),
        })
      );
    });

    it('should detect expired tokens', async () => {
      const expiredToken = 'expired.jwt.token';
      // Use dynamic import instead of require
      const { jwtDecode } = await import('jwt-decode');
      (jwtDecode as jest.Mock).mockImplementationOnce(() => ({
        sub: 'user123',
        name: 'Test User',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
      }));

      await expect(authManager['validateToken'](expiredToken)).rejects.toThrow(AuthError);
    });

    it('should handle token refresh correctly', async () => {
      mockFetch.mockImplementationOnce((url) => {
        if (url === 'http://localhost/api/auth/refresh') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ accessToken: 'new.valid.token' }),
          });
        }
        return Promise.reject(new Error('Unexpected request to ' + url));
      });

      await authManager['refreshToken']();
      expect(authManager['accessToken']).toBe('new.valid.token');
    });

    it('should queue requests during token refresh', async () => {
      authManager['isRefreshing'] = true;
      authManager['accessToken'] = 'valid.jwt.token';

      // Set up mock responses for test requests
      mockFetch.mockImplementation((url) => {
        switch (url) {
          case '/api/test1':
          case '/api/test2':
            return Promise.resolve({ ok: true });
          case '/api/auth/refresh':
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ accessToken: 'new.valid.token' }),
            });
          case '/api/auth/verify':
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ valid: true }),
            });
          default:
            return Promise.reject(new Error('Unexpected request to ' + url));
        }
      });

      // Queue the requests
      const request1Promise = authenticatedFetch('/api/test1');
      const request2Promise = authenticatedFetch('/api/test2');

      // Verify requests are queued
      expect(authManager['requestQueue'].length).toBe(2);

      // Complete refresh and execute queue
      authManager['isRefreshing'] = false;
      await authManager['executeQueuedRequests']();

      // Wait for both requests to complete
      await Promise.all([request1Promise, request2Promise]);

      // Verify queue is empty and requests were made
      expect(authManager['requestQueue'].length).toBe(0);
      expect(mockFetch).toHaveBeenCalledWith('/api/test1', expect.any(Object));
      expect(mockFetch).toHaveBeenCalledWith('/api/test2', expect.any(Object));
    });
  });

  describe('Logout Flow', () => {
    it('should handle logout correctly', async () => {
      // Setup initial authenticated state
      authManager['accessToken'] = 'valid.jwt.token';
      authManager.__test_setState({
        isAuthenticated: true,
        user: { id: 'user123', name: 'Test User' },
      });

      await authManager.logout();

      expect(authManager.isAuthenticated()).toBe(false);
      expect(authManager.getCurrentUser()).toBeNull();
      expect(authManager['accessToken']).toBeNull();
    });

    it('should handle logout failure gracefully', async () => {
      mockFetch.mockImplementationOnce((url) => {
        if (url === '/api/auth/logout') {
          return Promise.reject(new Error('Network error'));
        }
        return mockFetch(url);
      });

      await authManager.logout();

      expect(authManager.isAuthenticated()).toBe(false);
      expect(authManager.getCurrentUser()).toBeNull();
    });
  });

  describe('State Management', () => {
    it('should notify subscribers of state changes', () => {
      const listener = jest.fn();
      const unsubscribe = authManager.subscribe(listener);

      authManager.__test_setState({ isLoading: true });
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ isLoading: true }));

      unsubscribe();
      authManager.__test_setState({ isLoading: false });
      expect(listener).toHaveBeenCalledTimes(2); // Initial call + one state change
    });

    it('should handle multiple subscribers correctly', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      const unsubscribe1 = authManager.subscribe(listener1);
      const unsubscribe2 = authManager.subscribe(listener2);

      authManager.__test_setState({ error: 'test error' });

      expect(listener1).toHaveBeenCalledWith(expect.objectContaining({ error: 'test error' }));
      expect(listener2).toHaveBeenCalledWith(expect.objectContaining({ error: 'test error' }));

      unsubscribe1();
      unsubscribe2();
    });
  });

  describe('Authenticated Fetch', () => {
    it('should add authentication headers to requests', async () => {
      authManager['accessToken'] = 'valid.jwt.token';
      authManager['csrfToken'] = 'csrf-token';

      // Mock Headers implementation
      const mockHeaders = Object.create(mockHeadersProto);
      global.Headers = jest.fn().mockImplementation(() => mockHeaders);

      // Set up mock response
      mockFetch.mockImplementation((url) => {
        switch (url) {
          case '/api/test':
            return Promise.resolve({ ok: true });
          case '/api/auth/verify':
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ valid: true }),
            });
          default:
            return Promise.reject(new Error('Unexpected request to ' + url));
        }
      });

      await authenticatedFetch('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          credentials: 'include',
        })
      );
      expect(mockHeaders.set).toHaveBeenCalledWith('Authorization', 'Bearer valid.jwt.token');
      expect(mockHeaders.set).toHaveBeenCalledWith('X-CSRF-Token', 'csrf-token');
    });

    it('should handle 401 responses by refreshing token', async () => {
      authManager['accessToken'] = 'valid.jwt.token';
      authManager['csrfToken'] = 'csrf-token';

      // Mock Headers implementation
      const mockHeaders = Object.create(mockHeadersProto);
      global.Headers = jest.fn().mockImplementation(() => mockHeaders);

      let requestCount = 0;
      mockFetch.mockImplementation((url) => {
        switch (url) {
          case '/api/test':
            requestCount++;
            if (requestCount === 1) {
              return Promise.resolve({ ok: false, status: 401 });
            }
            return Promise.resolve({ ok: true });
          case '/api/auth/refresh':
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ accessToken: 'new.valid.token' }),
            });
          case '/api/auth/verify':
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ valid: true }),
            });
          default:
            return Promise.reject(new Error('Unexpected request to ' + url));
        }
      });

      await authenticatedFetch('/api/test');

      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial request + refresh + retry
      expect(mockHeaders.set).toHaveBeenCalledWith('Authorization', 'Bearer valid.jwt.token');
      expect(mockHeaders.set).toHaveBeenCalledWith('Authorization', 'Bearer new.valid.token');
    });

    it('should handle network errors in authenticated requests', async () => {
      authManager['accessToken'] = 'valid.jwt.token';

      mockFetch.mockImplementation((url) => {
        switch (url) {
          case '/api/test':
            throw new NetworkError('Connection failed', 500);
          case '/api/auth/verify':
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ valid: true }),
            });
          default:
            return Promise.reject(new Error('Unexpected request to ' + url));
        }
      });

      await expect(authenticatedFetch('/api/test')).rejects.toThrow(NetworkError);
    });
  });
});
