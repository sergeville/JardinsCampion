import { renderHook, act, waitFor } from '@testing-library/react';
import { useVoteManagement } from '@/hooks/useVoteManagement';
import { getAllLogoStats, getVoteHistory } from '@/app/actions';
import { checkDatabaseConnection } from '@/lib/mongodb';

// Mock the actions
jest.mock('@/app/actions', () => ({
  getAllLogoStats: jest.fn(),
  getVoteHistory: jest.fn(),
  submitVote: jest.fn(),
}));

// Mock the database connection check
jest.mock('@/lib/mongodb', () => ({
  checkDatabaseConnection: jest.fn(),
}));

describe('useVoteManagement Hook - Connection and Performance Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);
    (getAllLogoStats as jest.Mock).mockResolvedValue([]);
    (getVoteHistory as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should handle slow database responses without infinite loops', async () => {
    const mockStats = [{ logoId: 'logo1', totalVotes: 5 }];
    const mockHistory = [
      {
        userName: 'test',
        userId: 'user1',
        logoId: 'logo1',
        timestamp: new Date(),
      },
    ];

    // Simulate slow responses
    (getAllLogoStats as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockStats), 1000))
    );
    (getVoteHistory as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockHistory), 1000))
    );

    renderHook(() => useVoteManagement());

    // Initial load
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve(); // Flush promises
    });

    // Verify initial state
    expect(getAllLogoStats).toHaveBeenCalledTimes(1);
    expect(getVoteHistory).toHaveBeenCalledTimes(1);

    // Fast-forward past the refresh interval
    await act(async () => {
      jest.advanceTimersByTime(30000);
      await Promise.resolve(); // Flush promises
    });

    // Should trigger another load
    expect(getAllLogoStats).toHaveBeenCalledTimes(2);
    expect(getVoteHistory).toHaveBeenCalledTimes(2);
  });

  it('should handle database connection failures gracefully', async () => {
    const onError = jest.fn();
    const error = new Error('Database connection failed');

    // Mock both API calls to reject
    (getAllLogoStats as jest.Mock).mockRejectedValueOnce(error);
    (getVoteHistory as jest.Mock).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useVoteManagement(onError));

    // Wait for initial load and error handling
    await act(async () => {
      await Promise.resolve(); // Flush initial promises
      jest.advanceTimersByTime(100); // Small advance to trigger error handling
      await Promise.resolve(); // Flush promises after timer
      await Promise.resolve(); // Flush state updates
    });

    // Wait for the error state to be set
    await waitFor(() => {
      expect(result.current.error).toBe('Database connection failed');
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should prevent multiple simultaneous requests', async () => {
    const { result } = renderHook(() => useVoteManagement());

    // Trigger multiple refreshes
    await act(async () => {
      result.current.refreshData();
      result.current.refreshData();
      result.current.refreshData();
      await Promise.resolve(); // Flush promises
    });

    // Should have only made one set of requests
    expect(getAllLogoStats).toHaveBeenCalledTimes(1);
    expect(getVoteHistory).toHaveBeenCalledTimes(1);
  });

  it('should respect rate limiting between refreshes', async () => {
    const { result } = renderHook(() => useVoteManagement());

    // First refresh
    await act(async () => {
      result.current.refreshData();
      await Promise.resolve(); // Flush promises
    });

    expect(getAllLogoStats).toHaveBeenCalledTimes(1);

    // Try to refresh immediately
    await act(async () => {
      result.current.refreshData();
      await Promise.resolve(); // Flush promises
    });

    // Should not have made new requests
    expect(getAllLogoStats).toHaveBeenCalledTimes(1);

    // Wait for rate limit to expire
    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve(); // Flush promises
    });

    // Try to refresh again
    await act(async () => {
      result.current.refreshData();
      await Promise.resolve(); // Flush promises
    });

    // Should have made new requests
    expect(getAllLogoStats).toHaveBeenCalledTimes(2);
  });

  it('should cleanup resources on unmount', async () => {
    const { unmount } = renderHook(() => useVoteManagement());

    // Wait for initial load
    await act(async () => {
      await Promise.resolve(); // Flush promises
    });

    // Clear mock calls from initial load
    jest.clearAllMocks();

    // Unmount and advance timers
    unmount();
    await act(async () => {
      jest.advanceTimersByTime(30000); // Advance time by refresh interval
      await Promise.resolve(); // Flush promises
    });

    // Verify no new API calls after unmount
    expect(getAllLogoStats).not.toHaveBeenCalled();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useVoteManagement({}));
    expect(result.current.voteStats).toEqual({});
    expect(result.current.voteHistory).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors through onError callback', () => {
    const onError = jest.fn();
    renderHook(() => useVoteManagement({ onError }));
    // Test implementation here...
  });
});
