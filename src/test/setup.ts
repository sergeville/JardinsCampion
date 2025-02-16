import '@testing-library/jest-dom';
import { mockMongoose } from './setupMocks/mongoose';
import './setupMocks/next';
import './setupMocks/eventSource';
import * as utils from './setupMocks/utils';
import { mockModel, mockUserModel, mockVoteModel, mockLogoModel } from './setupMocks/models';

// Set up environment variables for testing
process.env.MONGODB_URI_DEV = 'mongodb://localhost:27017/test-db';
process.env.MONGODB_URI_PROD = 'mongodb://localhost:27017/test-db';
Object.defineProperty(process.env, 'NODE_ENV', { value: 'test' });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
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

// Mock mongoose
jest.mock('mongoose', () => mockMongoose);

// Mock models
jest.mock('@/models/User', () => mockUserModel);
jest.mock('@/models/Vote', () => mockVoteModel);
jest.mock('@/models/Logo', () => mockLogoModel);

// Mock utils
jest.mock('@/lib/utils', () => utils);

// Mock Next.js API route handlers
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: jest.fn((data) => ({
        json: () => Promise.resolve(data),
      })),
    },
  };
});
