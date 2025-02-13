import { useState, useEffect, useCallback } from 'react';

interface DatabaseState {
  schemas: {
    User: any;
    Vote: any;
    Logo: any;
  };
  users: any[];
  votes: any[];
  logos: any[];
  timestamp: string;
}

export const useDbSync = () => {
  const [dbState, setDbState] = useState<DatabaseState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [isSyncing, setIsSyncing] = useState(false);

  const sync = useCallback(async () => {
    try {
      setIsSyncing(true);
      const response = await fetch('/api/database-info');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to sync data');
      }

      setDbState({
        schemas: result.data.schemas || {
          User: {},
          Vote: {},
          Logo: {},
        },
        users: result.data.collections.users || [],
        votes: result.data.collections.votes || [],
        logos: result.data.collections.logos || [],
        timestamp: new Date().toISOString(),
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync data');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      if (eventSource) {
        eventSource.close();
      }

      setStatus('connecting');
      eventSource = new EventSource('/api/database-sync');

      eventSource.onopen = () => {
        setStatus('connected');
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setDbState((prevState) => ({
            ...data,
            schemas: data.schemas ||
              prevState?.schemas || {
                User: {},
                Vote: {},
                Logo: {},
              },
          }));
        } catch (err) {
          console.error('Failed to parse database update:', err);
          setError('Failed to parse database update');
        }
      };

      eventSource.onerror = () => {
        setStatus('disconnected');
        setError('Connection to database lost. Retrying...');

        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        // Clear any existing retry timeout
        if (retryTimeout) {
          clearTimeout(retryTimeout);
        }

        // Attempt to reconnect after 5 seconds
        retryTimeout = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (eventSource) {
        eventSource.close();
        setStatus('disconnected');
      }
    };
  }, []);

  return {
    dbState,
    error,
    status,
    isLoading: !dbState,
    isSyncing,
    sync,
  };
};
