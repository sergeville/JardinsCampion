import mongoose from 'mongoose';

// Mock collection methods
const mockCollection = {
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
  aggregate: jest.fn().mockResolvedValue([]),
  lean: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
  stats: jest.fn().mockResolvedValue({
    count: 0,
    size: 0,
    avgObjSize: 0,
    storageSize: 0,
  }),
};

// Mock database methods
const mockDb = {
  collection: jest.fn().mockReturnValue(mockCollection),
  stats: jest.fn().mockResolvedValue({
    collections: 0,
    views: 0,
    objects: 0,
    avgObjSize: 0,
    dataSize: 0,
    storageSize: 0,
    indexes: 0,
    indexSize: 0,
  }),
};

// Mock connection
const mockConnection = {
  readyState: 1,
  db: mockDb,
  on: jest.fn(),
  once: jest.fn(),
  emit: jest.fn(),
  collection: jest.fn().mockReturnValue(mockCollection),
  model: jest.fn().mockReturnValue({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((data) => ({ _id: 'mock-id', ...data })),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  }),
};

// Mock mongoose
const mockMongoose = {
  connect: jest.fn().mockResolvedValue({ connection: mockConnection }),
  connection: mockConnection,
  model: jest.fn().mockReturnValue({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((data) => ({ _id: 'mock-id', ...data })),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  }),
  Schema: jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    post: jest.fn(),
    add: jest.fn(),
    index: jest.fn(),
    set: jest.fn(),
  })),
  models: {},
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => id),
  },
};

// Mock the global mongoose
global.mongoose = mockMongoose;

// Export connectDB function
export async function connectDB() {
  return mockConnection;
}

// Export mongoose instance
export { mockMongoose as mongoose };

// Export default connectDB
export default connectDB;
