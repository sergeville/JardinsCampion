import { useState, useEffect } from 'react';
import axios from 'axios';

interface Vote {
  timestamp: string;
  [key: string]: any;
}

const useVoteManagement = () => {
  const [voteData, setVoteData] = useState<Vote | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const resolveVoteConflict = async (newVote: Vote, existingVote: Vote) => {
    try {
      // Implement a conflict resolution strategy here
      // For simplicity, using a last-write-wins approach
      const resolvedVote =
        new Date(newVote.timestamp) > new Date(existingVote.timestamp) ? newVote : existingVote;

      return resolvedVote;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw new Error('Failed to resolve vote conflict');
    }
  };

  const recordVote = async (vote: Vote) => {
    try {
      const response = await axios.post<Vote>('/api/record-vote', vote);
      setVoteData(response.data);
    } catch (err: any) {
      if (err.response && err.response.status === 409) {
        // Handle vote conflict
        const existingVote = err.response.data.existingVote;
        const resolvedVote = await resolveVoteConflict(vote, existingVote);
        const resolvedResponse = await axios.post<Vote>('/api/record-vote', resolvedVote);
        setVoteData(resolvedResponse.data);
      } else {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw new Error('Error recording vote');
      }
    }
  };

  return { voteData, error, recordVote };
};

export default useVoteManagement;
