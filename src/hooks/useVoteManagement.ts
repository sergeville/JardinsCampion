import { useState, useCallback, useEffect } from 'react';
import { getAllLogoStats, getVoteHistory, getUserVotes, submitVote } from '../app/actions';

interface VoteData {
  userName: string;
  userId: string;
  logoId: string;
  timestamp: Date;
  ownerId?: string;
}

interface UserVote {
  logoId: string;
  timestamp: Date;
}

export const useVoteManagement = ({ onError }: { onError?: (error: Error) => void } = {}) => {
  const [voteCount, setVoteCount] = useState<Record<string, number>>({});
  const [voteHistory, setVoteHistory] = useState<VoteData[]>([]);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial vote data
  useEffect(() => {
    const loadVoteData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading vote data...');

        const [stats, history] = await Promise.all([getAllLogoStats(), getVoteHistory(10)]);

        console.log('Received vote stats:', stats);
        console.log('Received vote history:', history);

        // Convert stats to voteCount format
        const counts: Record<string, number> = {};
        if (Array.isArray(stats)) {
          stats.forEach((stat: any) => {
            counts[stat.logoId] = stat.totalVotes || 0;
          });
        }
        setVoteCount(counts);
        console.log('Updated vote counts:', counts);

        // Convert history to VoteData format
        if (Array.isArray(history)) {
          const formattedHistory = history.map((vote: any) => ({
            userName: vote.userName || 'Unknown',
            userId: vote.userId || '',
            logoId: vote.logoId || '',
            timestamp: new Date(vote.timestamp || Date.now()),
            ownerId: vote.ownerId,
          }));
          setVoteHistory(formattedHistory);
          console.log('Updated vote history:', formattedHistory);
        }
      } catch (err) {
        console.error('Error loading vote data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load vote data';
        setError(errorMessage);
        if (onError) onError(err instanceof Error ? err : new Error(errorMessage));
      } finally {
        setLoading(false);
      }
    };

    loadVoteData();
  }, [onError]);

  const getUserPreviousVote = useCallback(async (userId: string) => {
    try {
      console.log('Getting previous votes for user:', userId);
      const votes = await getUserVotes(userId);
      console.log('Received user votes:', votes);
      if (Array.isArray(votes) && votes.length > 0) {
        return votes[0];
      }
      return undefined;
    } catch (err) {
      console.error('Error getting user votes:', err);
      return undefined;
    }
  }, []);

  const recordVote = useCallback(
    async (voteData: VoteData) => {
      try {
        setLoading(true);
        setError(null);
        console.log('Recording vote:', voteData);

        // Submit vote to database
        const result = await submitVote({
          userId: voteData.userId,
          logoId: voteData.logoId,
          ownerId: voteData.ownerId,
        });

        console.log('Vote submission result:', result);

        if (result?.status === 'confirmed') {
          // Update local state
          setVoteCount((prev) => ({
            ...prev,
            [voteData.logoId]: (prev[voteData.logoId] || 0) + 1,
          }));

          setVoteHistory((prev) =>
            [
              {
                ...voteData,
                timestamp: new Date(),
              },
              ...prev,
            ].slice(0, 10)
          );

          console.log('Local state updated after vote');
          return result;
        } else if (result?.conflictResolution) {
          // Handle conflict resolution
          const { originalVote, resolutionType } = result.conflictResolution;
          if (resolutionType === 'override') {
            // Update local state to reflect the override
            setVoteHistory((prev) => {
              const newHistory = prev.filter((v) => v.userId !== voteData.userId);
              return [
                {
                  ...voteData,
                  timestamp: new Date(),
                },
                ...newHistory,
              ].slice(0, 10);
            });
            console.log('Local state updated after vote conflict resolution');
          }
          return originalVote;
        }
      } catch (err) {
        console.error('Error recording vote:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to record vote';
        setError(errorMessage);
        if (onError) onError(err instanceof Error ? err : new Error(errorMessage));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [onError]
  );

  return {
    voteCount,
    voteHistory,
    userVotes,
    getUserPreviousVote,
    recordVote,
    loading,
    error,
  };
};
