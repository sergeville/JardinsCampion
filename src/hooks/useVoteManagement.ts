import { useState, useCallback } from 'react';

interface VoteData {
  userName: string;
  userId: string;
  logoId: string;
  timestamp: Date;
  ownerId?: string;
}

interface UserVote {
  userName: string;
  userId: string;
  logoId: string;
}

export const useVoteManagement = () => {
  const [voteCount, setVoteCount] = useState<Record<string, number>>({});
  const [voteHistory, setVoteHistory] = useState<VoteData[]>([]);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);

  const getUserPreviousVote = useCallback(
    (userId: string): UserVote | undefined => {
      return userVotes.find((vote) => vote.userId === userId);
    },
    [userVotes]
  );

  const recordVote = useCallback(
    (voteData: VoteData) => {
      const previousVote = getUserPreviousVote(voteData.userId);

      if (previousVote) {
        setVoteCount((prev) => ({
          ...prev,
          [previousVote.logoId]: Math.max((prev[previousVote.logoId] || 0) - 1, 0),
        }));

        setUserVotes((prev) => prev.filter((vote) => vote.userId !== voteData.userId));
      }

      setVoteCount((prev) => ({
        ...prev,
        [voteData.logoId]: (prev[voteData.logoId] || 0) + 1,
      }));

      setUserVotes((prev) => [
        ...prev,
        {
          userName: voteData.userName,
          userId: voteData.userId,
          logoId: voteData.logoId,
        },
      ]);

      setVoteHistory((prev) => [...prev, voteData]);

      return previousVote;
    },
    [getUserPreviousVote]
  );

  return {
    voteCount,
    voteHistory,
    userVotes,
    getUserPreviousVote,
    recordVote,
  };
};
