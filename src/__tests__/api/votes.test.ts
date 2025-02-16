import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/votes/route';
import { DatabaseService } from '@/lib/services/databaseService';
import { mockMongoose, mockSession } from '@/test/setupMocks/mongoose';

// Mock mongoose
jest.mock('mongoose', () => ({
  ...mockMongoose,
  startSession: jest.fn().mockResolvedValue(mockSession),
  connect: jest.fn(),
  connection: {
    readyState: 1,
  },
}));

// Mock the DatabaseService
jest.mock('@/lib/services/databaseService', () => ({
  DatabaseService: {
    getVoteHistory: jest.fn(),
    getUserVotes: jest.fn(),
    getAllLogoStats: jest.fn(),
    submitVote: jest.fn(),
  },
}));

describe('Votes API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET requests', () => {
    it('should handle vote history request correctly', async () => {
      const mockHistory = [
        {
          userId: 'user1',
          logoId: 'logo1',
          timestamp: new Date(),
        },
      ];
      (DatabaseService.getVoteHistory as jest.Mock).mockResolvedValueOnce(mockHistory);

      const request = new NextRequest('http://localhost/api/votes?action=history&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockHistory);
      expect(DatabaseService.getVoteHistory).toHaveBeenCalledWith(10);
    });

    it('should handle user votes request correctly', async () => {
      const mockVotes = [{ logoId: 'logo1', timestamp: new Date() }];
      (DatabaseService.getUserVotes as jest.Mock).mockResolvedValueOnce(mockVotes);

      const request = new NextRequest('http://localhost/api/votes?action=userVotes&userId=user1');
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockVotes);
      expect(DatabaseService.getUserVotes).toHaveBeenCalledWith('user1');
    });

    it('should handle missing userId for userVotes request', async () => {
      const request = new NextRequest('http://localhost/api/votes?action=userVotes');
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('userId is required');
      expect(DatabaseService.getUserVotes).not.toHaveBeenCalled();
    });

    it('should handle stats request correctly', async () => {
      const mockStats = { logo1: 5, logo2: 3 };
      (DatabaseService.getAllLogoStats as jest.Mock).mockResolvedValueOnce(mockStats);

      const request = new NextRequest('http://localhost/api/votes?action=stats');
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockStats);
      expect(DatabaseService.getAllLogoStats).toHaveBeenCalled();
    });

    it('should handle invalid action', async () => {
      const request = new NextRequest('http://localhost/api/votes?action=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid action');
    });

    it('should handle getVoteHistory service error', async () => {
      (DatabaseService.getVoteHistory as jest.Mock).mockRejectedValueOnce(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost/api/votes?action=history&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Database error');
    });

    it('should handle invalid limit parameter', async () => {
      const request = new NextRequest('http://localhost/api/votes?action=history&limit=invalid');
      await GET(request);

      expect(DatabaseService.getVoteHistory).toHaveBeenCalledWith(NaN);
    });

    it('should handle getAllLogoStats service error', async () => {
      (DatabaseService.getAllLogoStats as jest.Mock).mockRejectedValueOnce(
        new Error('Stats calculation failed')
      );

      const request = new NextRequest('http://localhost/api/votes?action=stats');
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Stats calculation failed');
    });
  });

  describe('POST requests', () => {
    it('should handle valid vote submission', async () => {
      const mockVote = {
        userId: 'user1',
        logoId: 'logo1',
        ownerId: 'owner1',
      };

      (DatabaseService.submitVote as jest.Mock).mockResolvedValueOnce({
        success: true,
        voteId: 'vote1',
      });

      const request = new NextRequest('http://localhost/api/votes', {
        method: 'POST',
        body: JSON.stringify(mockVote),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(DatabaseService.submitVote).toHaveBeenCalledWith(mockVote, undefined);
    });

    it('should handle missing required fields', async () => {
      const mockVote = {
        userId: 'user1',
      };

      const request = new NextRequest('http://localhost/api/votes', {
        method: 'POST',
        body: JSON.stringify(mockVote),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('userId and logoId are required');
      expect(DatabaseService.submitVote).not.toHaveBeenCalled();
    });

    it('should handle vote submission errors', async () => {
      const mockVote = {
        userId: 'user1',
        logoId: 'logo1',
      };

      const mockError = new Error('Vote submission failed');
      (DatabaseService.submitVote as jest.Mock).mockRejectedValueOnce(mockError);

      const request = new NextRequest('http://localhost/api/votes', {
        method: 'POST',
        body: JSON.stringify(mockVote),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Vote submission failed');
    });

    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost/api/votes', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Unexpected token \'i\', "invalid json" is not valid JSON');
    });

    it('should handle empty request body', async () => {
      const request = new NextRequest('http://localhost/api/votes', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Request body is required');
    });

    it('should handle duplicate vote submission', async () => {
      const mockVote = {
        userId: 'user1',
        logoId: 'logo1',
      };

      (DatabaseService.submitVote as jest.Mock).mockRejectedValueOnce(
        new Error('User has already voted for this logo')
      );

      const request = new NextRequest('http://localhost/api/votes', {
        method: 'POST',
        body: JSON.stringify(mockVote),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('User has already voted for this logo');
    });
  });
});
