import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllLogoStats, getVoteHistory, submitVote } from '@/app/actions';
import type { VoteData, VoteResult, Logo } from '@/types/vote';
import { networkRequest, NetworkError } from '@/lib/utils/networkManager';

const REFRESH_INTERVAL = 60000; // 60 seconds
const RATE_LIMIT = 10000; // 10 seconds
const MAX_BATCH_SIZE = 10;

interface UserVote {
  userName: string;
  userId: string;
  logoId: string;
  timestamp: Date;
  ownerId?: string;
}

interface RequestState {
  loading: boolean;
  error: string | null;
  retryCount: number;
}

interface VoteManagementProps {
  onError?: (error: Error) => void;
}

interface VoteManagementResult {
  voteStats: Record<string, number>;
  voteHistory: VoteData[];
  userVotes: UserVote[];
  loading: boolean;
  error: string | null;
  retryCount: number;
  refreshData: () => void;
  recordVote: (voteData: VoteData) => Promise<VoteResult | undefined>;
  voteCount: Record<string, number>;
  selectedLogo: Logo | null;
  handleLogoSelection: (logo: Logo) => void;
}

export function useVoteManagement({ onError }: VoteManagementProps = {}): VoteManagementResult {
  const [voteStats, setVoteStats] = useState<Record<string, number>>({});
  const [voteCount, setVoteCount] = useState<Record<string, number>>({});
  const [voteHistory, setVoteHistory] = useState<VoteData[]>([]);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [selectedLogo, setSelectedLogo] = useState<Logo | null>(null);
  const [requestState, setRequestState] = useState<RequestState>({
    loading: false,
    error: null,
    retryCount: 0,
  });
  const lastRefreshTime = useRef<number>(0);
  const mounted = useRef(true);
  const abortController = useRef<AbortController | null>(null);

  const handleLogoSelection = useCallback((logo: Logo) => {
    setSelectedLogo(logo);
  }, []);

  const cancelPendingRequests = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
  }, []);

  const loadVoteData = useCallback(
    async (force = false) => {
      if ((!force && requestState.loading) || !mounted.current) return;

      const now = Date.now();
      if (!force && now - lastRefreshTime.current < RATE_LIMIT) {
        return;
      }

      cancelPendingRequests();
      abortController.current = new AbortController();

      try {
        setRequestState((prev) => ({ ...prev, loading: true }));

        const [stats, historyResponse, users] = await Promise.all([
          networkRequest.standard(
            async () => {
              const response = await fetch('/api/votes?action=stats');
              if (!response.ok) {
                throw new Error('Failed to fetch logo stats');
              }
              const data = await response.json();
              return data.data;
            },
            {
              maxRetries: 2,
              onRetry: (error, attempt) => {
                setRequestState((prev) => ({
                  ...prev,
                  retryCount: attempt,
                  error: `Retrying... (${attempt}/2)`,
                }));
              },
            }
          ),
          networkRequest.quick(
            async () => {
              const response = await fetch('/api/votes?action=history');
              if (!response.ok) {
                throw new Error('Failed to fetch vote history');
              }
              const data = await response.json();
              return data.data || [];
            },
            {
              maxRetries: 2,
              onRetry: (error, attempt) => {
                console.warn(`Retrying vote history fetch (${attempt}/2):`, error);
              },
            }
          ),
          networkRequest.quick(
            async () => {
              const response = await fetch('/api/users');
              if (!response.ok) {
                throw new Error('Failed to fetch users');
              }
              const data = await response.json();
              return data;
            },
            {
              maxRetries: 2,
              onRetry: (error, attempt) => {
                console.warn(`Retrying users fetch (${attempt}/2):`, error);
              },
            }
          ),
        ]);

        if (!mounted.current) return;

        // Create a map of user IDs to user names
        const userMap = users.reduce((acc: Record<string, string>, user: any) => {
          acc[user.userId] = user.name;
          return acc;
        }, {});

        // Add userName to each vote in the history
        const voteHistoryWithUserNames = historyResponse.map((vote: VoteData) => ({
          ...vote,
          userName: userMap[vote.userId] || 'Unknown User',
        }));

        setRequestState((prev) => ({
          ...prev,
          error: null,
          retryCount: 0,
        }));
        setVoteStats(stats);
        setVoteCount(stats);
        setVoteHistory(voteHistoryWithUserNames);
        lastRefreshTime.current = now;
      } catch (error) {
        if (!mounted.current) return;

        const networkError = error instanceof NetworkError ? error : null;
        const errorMessage = networkError
          ? `Request failed${networkError.isTimeout ? ' (timeout)' : ''}: ${networkError.message}`
          : 'Failed to load vote data';

        console.error('Error loading vote data:', error);
        setRequestState((prev) => ({
          ...prev,
          error: errorMessage,
          retryCount: networkError?.attempt || 0,
        }));

        onError?.(error instanceof Error ? error : new Error(errorMessage));
      } finally {
        if (mounted.current) {
          setRequestState((prev) => ({ ...prev, loading: false }));
        }
      }
    },
    [requestState.loading, onError, cancelPendingRequests]
  );

  useEffect(() => {
    mounted.current = true;
    loadVoteData(true);

    const interval = setInterval(() => {
      if (mounted.current) {
        loadVoteData();
      }
    }, REFRESH_INTERVAL);

    return () => {
      mounted.current = false;
      cancelPendingRequests();
      clearInterval(interval);
    };
  }, [loadVoteData, cancelPendingRequests]);

  const refreshData = useCallback(() => {
    loadVoteData(true);
  }, [loadVoteData]);

  const recordVote = useCallback(
    async (voteData: VoteData) => {
      if (!mounted.current) return;

      try {
        const result = await networkRequest.standard(
          async () => {
            const response = await fetch('/api/votes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(voteData),
            });

            const data = await response.json();

            if (!response.ok) {
              // For 409 Conflict (already voted), return a special result
              if (response.status === 409) {
                return {
                  success: false,
                  status: 'rejected',
                  conflictResolution: {
                    originalVote: data.error,
                    resolutionType: 'reject',
                    resolvedAt: new Date(),
                  },
                };
              }

              // Handle other error cases
              if (response.status === 401) {
                throw new Error('Please ensure you are logged in before voting');
              }
              if (response.status === 408) {
                throw new Error('Vote submission timed out. Please try again.');
              }
              throw new Error(data.error || 'Failed to submit vote');
            }

            return {
              success: true,
              status: 'confirmed',
              data: data.data,
            };
          },
          {
            maxRetries: 2,
            onRetry: (error, attempt) => {
              console.warn(`Retrying vote submission (${attempt}/2):`, error);
              setRequestState((prev) => ({
                ...prev,
                error: `Retrying vote submission (${attempt}/2)...`,
                retryCount: attempt,
              }));
            },
          }
        );

        setRequestState((prev) => ({
          ...prev,
          error: null,
          retryCount: 0,
        }));

        if (result.success) {
          // Immediately refresh data from server to ensure accurate counts
          await loadVoteData(true);

          // Update local state for immediate feedback
          const updatedStats = {
            ...voteStats,
            [voteData.logoId]: (voteStats[voteData.logoId] || 0) + 1,
          };
          setVoteStats(updatedStats);
          setVoteCount(updatedStats);

          setVoteHistory((prev) =>
            [
              {
                ...voteData,
                timestamp: new Date(voteData.timestamp),
              },
              ...prev,
            ].slice(0, MAX_BATCH_SIZE)
          );
        }

        return result;
      } catch (error) {
        const networkError = error instanceof NetworkError ? error : null;
        const errorMessage = networkError
          ? `Vote submission failed${networkError.isTimeout ? ' (timeout)' : ''}: ${networkError.message}`
          : error instanceof Error
            ? error.message
            : 'Failed to record vote';

        console.error('Error recording vote:', error);
        onError?.(error instanceof Error ? error : new Error(errorMessage));
        throw error;
      }
    },
    [onError, voteStats, loadVoteData]
  );

  const resolveVoteConflict = async (newVote: VoteData, existingVote: VoteData) => {
    try {
      // Implement a conflict resolution strategy here
      // For simplicity, using a last-write-wins approach
      return newVote;
    } catch (error) {
      console.error('Error resolving vote conflict:', error);
      throw error;
    }
  };

  return {
    voteStats,
    voteHistory,
    userVotes,
    loading: requestState.loading,
    error: requestState.error,
    retryCount: requestState.retryCount,
    refreshData,
    recordVote,
    voteCount,
    selectedLogo,
    handleLogoSelection,
  };
}
