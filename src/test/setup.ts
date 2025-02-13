import React from 'react';
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { createElement } from 'react';
import Image from 'next/image';
import mongoose from 'mongoose';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
    };
  },
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: 'img',
}));

// Mock mongoose
jest.mock('@/lib/mongodb', () => {
  const mockMongoose = {
    connect: jest.fn().mockResolvedValue({
      connection: {
        readyState: 1
      }
    }),
    connection: {
      readyState: 1
    },
    Schema: function() {
      return {
        pre: jest.fn(),
        index: jest.fn(),
      };
    },
    model: jest.fn(),
    models: {},
    Query: {
      prototype: {
        exec: jest.fn(),
      }
    }
  };

  return {
    __esModule: true,
    default: mockMongoose.connect,
    mongoose: mockMongoose,
  };
});

// Mock environment variables
process.env.MONGODB_URI_DEV = 'mongodb://mock:27017/test';
process.env.MONGODB_URI_PROD = 'mongodb://mock:27017/test';
process.env.NODE_ENV = 'test';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.alert
window.alert = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Add TextEncoder/TextDecoder to global
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

jest.mock('mongoose', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
    connection: {
      on: jest.fn(),
      once: jest.fn(),
      readyState: 1,
    },
    model: jest.fn(),
    Schema: jest.fn(),
    models: {},
    prototype: {
      save: jest.fn(),
    },
  },
})); 