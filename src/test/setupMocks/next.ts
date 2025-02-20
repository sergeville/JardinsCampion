import { NextRequest } from 'next/server';

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
    super(input, init);
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
