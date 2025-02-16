import { IUser } from '@/models/User';
import { IVote } from '@/models/Vote';
import { ILogo } from '@/models/Logo';

// Mock User model
export const mockUserModel = {
  findByUserId: jest.fn().mockImplementation((userId: string) => ({
    exec: jest.fn().mockResolvedValue({
      _id: 'mock-user-id',
      userId,
      name: `Mock User ${userId}`,
      voteCount: 0,
      votedLogos: [],
      canVote: jest.fn().mockReturnValue(true),
    }),
  })),
  findOne: jest.fn().mockImplementation(() => ({
    exec: jest.fn().mockResolvedValue(null),
  })),
  create: jest.fn().mockImplementation((data: Partial<IUser>) => ({
    _id: 'mock-user-id',
    ...data,
    canVote: jest.fn().mockReturnValue(true),
  })),
  updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
};

// Mock Vote model
export const mockVoteModel = {
  findUserVotes: jest.fn().mockResolvedValue([]),
  getVoteStats: jest.fn().mockResolvedValue([{ totalVotes: 0, uniqueVoters: 0 }]),
  find: jest.fn().mockImplementation(() => ({
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([]),
  })),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockImplementation((data: Partial<IVote>) => ({
    _id: 'mock-vote-id',
    ...data,
    timestamp: new Date(),
    status: 'pending',
  })),
};

// Mock Logo model
export const mockLogoModel = {
  findActiveLogo: jest.fn().mockImplementation((value: string) => ({
    exec: jest.fn().mockResolvedValue({
      _id: 'mock-logo-id',
      value,
      src: `/logos/Logo${value}.png`,
      alt: `Mock Logo ${value}`,
      status: 'active',
      voteStats: {
        totalVotes: 0,
        uniqueVoters: 0,
      },
    }),
  })),
  find: jest.fn().mockImplementation(() => ({
    lean: jest.fn().mockResolvedValue([]),
  })),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockImplementation((data: Partial<ILogo>) => ({
    _id: 'mock-logo-id',
    ...data,
    status: 'active',
    voteStats: {
      totalVotes: 0,
      uniqueVoters: 0,
    },
  })),
};

// Mock all models
jest.mock('@/models/User', () => ({
  __esModule: true,
  default: mockUserModel,
}));

jest.mock('@/models/Vote', () => ({
  __esModule: true,
  default: mockVoteModel,
}));

jest.mock('@/models/Logo', () => ({
  __esModule: true,
  default: mockLogoModel,
}));
