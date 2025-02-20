import { NextRequest } from 'next/server';
import type { RequestInit } from 'next/dist/server/web/spec-extension/request';

// Mock Headers
const mockHeaders = {
  get: jest.fn(),
  set: jest.fn(),
  append: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(),
  entries: jest.fn(() => [][Symbol.iterator]()),
  keys: jest.fn(() => [][Symbol.iterator]()),
  values: jest.fn(() => [][Symbol.iterator]()),
  [Symbol.iterator]: jest.fn(() => [][Symbol.iterator]()),
};

// Mock Request
const originalNextRequest = NextRequest;
class MockNextRequest extends originalNextRequest {
  constructor(input: string | Request, init?: RequestInit) {
    // Create a minimal RequestInit object that matches Next.js requirements
    const nextInit = init ? {
      method: init.method,
      headers: init.headers,
      body: init.body,
      signal: init.signal === null ? undefined : init.signal,
      cache: init.cache,
      credentials: init.credentials,
      integrity: init.integrity,
      keepalive: init.keepalive,
      mode: init.mode,
      redirect: init.redirect,
      referrer: init.referrer,
      referrerPolicy: init.referrerPolicy,
      window: init.window,
    } : {};

    super(input, nextInit as RequestInit);
    Object.defineProperty(this, 'cookies', {
      get: () => ({
        get: jest.fn(),
        getAll: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        has: jest.fn(),
        clear: jest.fn(),
      }),
    });
  }
}

// Replace NextRequest with our mock
(global as any).NextRequest = MockNextRequest;

export { MockNextRequest };
