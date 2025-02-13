import { useState, useEffect, useCallback } from 'react';
import { DatabaseInfo, DatabaseSyncState, DatabaseAction } from '@/types/database';

export function useDbSync() {
  const [state, setState] = useState<DatabaseSyncState>({
    collections: {
      users: { data: [], lastUpdated: new Date() },
      votes: { data: [], lastUpdated: new Date() },
      logos: { data: [], lastUpdated: new Date() },
    },
    connected: false,
    error: null,
  });

  const handleServerSentEvent = useCallback((event: MessageEvent) => {
    try {
      const action = JSON.parse(event.data) as DatabaseAction<unknown>;
      setState((prevState) => {
        const collections = { ...prevState.collections };
        const collection = collections[action.collection];

        if (!collection) return prevState;

        switch (action.type) {
          case 'add':
            collection.data = [...collection.data, action.data];
            break;
          case 'update':
            collection.data = collection.data.map((item) =>
              item._id === action.data._id ? action.data : item
            );
            break;
          case 'delete':
            collection.data = collection.data.filter(
              (item) => item._id !== action.data._id
            );
            break;
          default:
            console.warn('Unknown action type:', action.type);
            return prevState;
        }

        collection.lastUpdated = action.timestamp;
        return { ...prevState, collections };
      });
    } catch (error) {
      console.error('Error processing SSE:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    }
  }, []);

  useEffect(() => {
    const eventSource = new EventSource('/api/database-sync');

    eventSource.onopen = () => {
      setState((prev) => ({ ...prev, connected: true, error: null }));
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      setState((prev) => ({
        ...prev,
        connected: false,
        error: new Error('Connection error'),
      }));
    };

    eventSource.onmessage = handleServerSentEvent;

    return () => {
      eventSource.close();
      setState((prev) => ({ ...prev, connected: false }));
    };
  }, [handleServerSentEvent]);

  return state;
} 