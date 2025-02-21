import React, { createContext, useContext, useState } from 'react';
import { Logo } from '@/types/database';

interface DatabaseContextType {
  logos: Logo[];
  loading: boolean;
  error: Error | null;
  fetchLogos: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType>({
  logos: [],
  loading: false,
  error: null,
  fetchLogos: async () => {},
});

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchLogos = async () => {
    try {
      setLoading(true);
      setError(null);
      // Implement logo fetching logic here
      // This is a placeholder - implement actual database fetching
      const mockLogos: Logo[] = [
        { id: '1', url: '/logo1.png', votes: 0 },
        { id: '2', url: '/logo2.png', votes: 0 },
      ];
      setLogos(mockLogos);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch logos'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DatabaseContext.Provider
      value={{
        logos,
        loading,
        error,
        fetchLogos,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => useContext(DatabaseContext);
export default DatabaseContext;
