import { mockMongoose } from '@/test/setupMocks/mongoose';
import { connectDB, checkDatabaseConnection } from '@/lib/mongodb';

jest.setTimeout(30000); // Increase timeout for all tests in this file

describe('MongoDB Connection', () => {
  beforeEach(() => {
    mockMongoose._clearConnections();
  });

  it('should create new connection when none exists', async () => {
    const connection = await connectDB();
    expect(mockMongoose.connect).toHaveBeenCalled();
    expect(connection.readyState).toBe(1);
  });

  it('should reuse existing connection when available', async () => {
    const firstConnection = await connectDB();
    const initialCallCount = mockMongoose.connect.mock.calls.length;
    const secondConnection = await connectDB();
    expect(mockMongoose.connect.mock.calls.length).toBe(initialCallCount);
    expect(secondConnection).toBe(firstConnection);
  });

  it('should create new connection when cached connection is invalid', async () => {
    const firstConnection = await connectDB();
    const initialCallCount = mockMongoose.connect.mock.calls.length;
    firstConnection.readyState = 0; // Invalidate the connection
    const secondConnection = await connectDB();
    expect(mockMongoose.connect.mock.calls.length).toBe(initialCallCount + 1);
    expect(secondConnection).not.toBe(firstConnection);
    expect(secondConnection.readyState).toBe(1);
  });

  it('should return correct health status', async () => {
    // Test unhealthy state
    mockMongoose.shouldFailNextConnect = true;
    const isNotHealthy = await checkDatabaseConnection();
    expect(isNotHealthy).toBe(false);

    // Test healthy state
    mockMongoose.shouldFailNextConnect = false;
    const isHealthy = await checkDatabaseConnection();
    expect(isHealthy).toBe(true);
  });

  it('should handle connection errors', async () => {
    mockMongoose.shouldFailNextConnect = true;
    await expect(connectDB()).rejects.toThrow('Unable to connect to the database');
    expect(mockMongoose.connect.mock.calls.length).toBe(3); // 3 retries
  });
});
