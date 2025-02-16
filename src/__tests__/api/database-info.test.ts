import { NextRequest } from 'next/server';
import { POST } from '@/app/api/database-info/[action]/route';
import { mockModel, resetMocks } from '@/test/setupMocks/models';
import { mockMongoose } from '@/test/setupMocks/mongoose';

jest.mock('mongoose', () => ({
  ...mockMongoose,
  startSession: jest.fn(),
  connect: jest.fn(),
  connection: {
    readyState: 1,
  },
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    ...mockModel,
    collection: {
      stats: jest.fn().mockResolvedValue({
        count: 0,
        size: 0,
        avgObjSize: 0,
      }),
    },
  },
}));

jest.mock('@/models/Vote', () => ({
  __esModule: true,
  default: {
    ...mockModel,
    collection: {
      stats: jest.fn().mockResolvedValue({
        count: 0,
        size: 0,
        avgObjSize: 0,
      }),
    },
  },
}));

jest.mock('@/models/Logo', () => ({
  __esModule: true,
  default: {
    ...mockModel,
    collection: {
      stats: jest.fn().mockResolvedValue({
        count: 0,
        size: 0,
        avgObjSize: 0,
      }),
    },
  },
}));

describe('Database Info API', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should return database stats', async () => {
    const request = new NextRequest('http://localhost:3000/api/database-info/stats', {
      method: 'POST',
      body: JSON.stringify({
        collectionName: 'users',
      }),
    });

    const response = await POST(request, { params: { action: 'stats' } });
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.stats).toBeDefined();
    expect(data.stats).toEqual({
      count: 0,
      size: 0,
      avgObjSize: 0,
    });
  });

  // Add more test cases as needed
});
