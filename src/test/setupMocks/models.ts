import mongoose, { Model, Document } from 'mongoose';
import { User } from '@/types/auth';
import { ILogo } from '@/models/Logo';
import { VoteDocument } from '@/types/vote';

export type MockModel<T extends Document = Document> = {
  [K in keyof Model<T>]: jest.Mock;
} & {
  mockClear: () => void;
};

interface MockModelFunctions<T extends Document = Document> {
  find: jest.Mock<Promise<T[]>>;
  findOne: jest.Mock<Promise<T | null>>;
  findById: jest.Mock<Promise<T | null>>;
  findByIdAndUpdate: jest.Mock<Promise<T | null>>;
  findByIdAndDelete: jest.Mock<Promise<T | null>>;
  create: jest.Mock<Promise<T>>;
  updateOne: jest.Mock<Promise<{ modifiedCount: number }>>;
  deleteOne: jest.Mock<Promise<{ deletedCount: number }>>;
  deleteMany: jest.Mock<Promise<{ deletedCount: number }>>;
  countDocuments: jest.Mock<Promise<number>>;
  save: jest.Mock<Promise<T>>;
  exec: jest.Mock<Promise<T>>;
  findByUserId?: jest.Mock<Promise<T | null>>;
  findUserVotes?: jest.Mock<Promise<T[]>>;
  getVoteStats?: jest.Mock<Promise<Array<{ totalVotes: number; uniqueVoters: number }>>>;
}

// Create mock model functions
export const createMockModelFunctions = <T extends Document>(): MockModelFunctions<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  create: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
  deleteMany: jest.fn(),
  countDocuments: jest.fn(),
  save: jest.fn(),
  exec: jest.fn(),
});

// Create mock model instance
const mockModelFunctions: MockModelFunctions = {
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  create: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
  deleteMany: jest.fn(),
  countDocuments: jest.fn(),
  save: jest.fn(),
  exec: jest.fn(),
  findByUserId: jest.fn(),
  findUserVotes: jest.fn(),
  getVoteStats: jest.fn(),
};

// Create a mock model constructor
export const mockModel = jest.fn(() => mockModelFunctions) as unknown as MockModel & jest.Mock;

// Add static methods to the mock model
Object.assign(mockModel, mockModelFunctions);

// Create mock models with proper types
export const mockUserModel = Object.assign(
  jest.fn(() => createMockModelFunctions<User>()),
  createMockModelFunctions<User>(),
  { mockClear: jest.fn() }
) as unknown as Model<User> & { mockClear: () => void };

export const mockLogoModel = Object.assign(
  jest.fn(() => createMockModelFunctions<ILogo>()),
  createMockModelFunctions<ILogo>(),
  { mockClear: jest.fn() }
) as unknown as Model<ILogo> & { mockClear: () => void };

export const mockVoteModel = Object.assign(
  jest.fn(() => createMockModelFunctions<VoteDocument>()),
  createMockModelFunctions<VoteDocument>(),
  { mockClear: jest.fn() }
) as unknown as Model<VoteDocument> & { mockClear: () => void };

// Reset all mocks
export const resetMocks = () => {
  Object.values(mockModelFunctions).forEach((mock) => mock.mockReset());
  mockModel.mockClear();
  mockUserModel.mockClear();
  mockVoteModel.mockClear();
  mockLogoModel.mockClear();
};
