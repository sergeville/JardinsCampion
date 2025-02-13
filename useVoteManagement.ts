import { useState, useEffect } from 'react';
import axios from 'axios';

const useVoteManagement = () => {
  const [voteData, setVoteData] = useState(null);
  const [error, setError] = useState(null);

  const resolveVoteConflict = async (newVote, existingVote) => {
    try {
      // Implement a conflict resolution strategy here
      // For simplicity, using a last-write-wins approach
      const resolvedVote =
        new Date(newVote.timestamp) > Date(existingVote.timestamp) ? newVote : existingVote;

      return resolvedVote;
    } catch (err) {
      setError(err);
      throw new Error('Failed to resolve vote conflict');
    }
  };

  const recordVote = async (vote) => {
    try {
      const response = await axios.post('/api/record-vote', vote);
      setVoteData(response.data);
    } catch (err) {
      if (err.response && err.response.status === 409) {
        // Handle vote conflict
        const existingVote = err.response.data.existingVote;
        const resolvedVote = await resolveVoteConflict(vote, existingVote);
        await axios.post('/api/record-vote', resolvedVote);
      } else {
        setError(err);
        throw new Error('Error recording vote');
      }
    }
  };

  return { voteData, error, recordVote };
};

export default useVoteManagement;
