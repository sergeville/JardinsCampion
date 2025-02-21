import React, { createContext, useContext, useState } from 'react';
import { VoteData } from '@/types/vote';

interface VoteContextType {
  selectedLogo: string | null;
  voteCount: Record<string, number>;
  loading: boolean;
  error: Error | null;
  setSelectedLogo: (logoId: string | null) => void;
  recordVote: (voteData: VoteData) => Promise<void>;
}

const VoteContext = createContext<VoteContextType>({
  selectedLogo: null,
  voteCount: {},
  loading: false,
  error: null,
  setSelectedLogo: () => {},
  recordVote: async () => {},
});

export const VoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [voteCount, setVoteCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const recordVote = async (voteData: VoteData) => {
    try {
      setLoading(true);
      setError(null);
      // Implement vote recording logic here
      setVoteCount((prev) => ({
        ...prev,
        [voteData.logoId]: (prev[voteData.logoId] || 0) + 1,
      }));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to record vote'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <VoteContext.Provider
      value={{
        selectedLogo,
        voteCount,
        loading,
        error,
        setSelectedLogo,
        recordVote,
      }}
    >
      {children}
    </VoteContext.Provider>
  );
};

export const useVote = () => useContext(VoteContext);
export default VoteContext;
