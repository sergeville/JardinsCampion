// @ts-check
import { DatabaseAction, DatabaseCollections, DatabaseSyncState } from '@/types/database';
import { IUser } from '@/models/User';
import { IVote } from '@/models/Vote';
import { ILogo } from '@/models/Logo';
import { useEffect, useReducer, Reducer, useCallback } from 'react';

type CollectionType = keyof DatabaseCollections;
type CollectionData = {
  users: IUser[];
  votes: IVote[];
  logos: ILogo[];
};

type CollectionState<T extends CollectionType> = {
  data: CollectionData[T];
  lastUpdated: Date;
};

type DatabaseState = {
  collections: {
    users: CollectionState<'users'>;
    votes: CollectionState<'votes'>;
    logos: CollectionState<'logos'>;
  };
  connected: boolean;
  error: Error | null;
};

const initialState: DatabaseState = {
  collections: {
    users: { data: [], lastUpdated: new Date() },
    votes: { data: [], lastUpdated: new Date() },
    logos: { data: [], lastUpdated: new Date() },
  },
  connected: false,
  error: null,
};

function updateCollection<T extends CollectionType>(
  collection: CollectionState<T>,
  action: DatabaseAction<CollectionData[T][number]>
): CollectionState<T> {
  const currentData = [...collection.data];
  let newData: CollectionData[T][number][] = [];

  switch (action.type) {
    case 'add':
      newData = [...currentData, action.data];
      break;
    case 'update':
      newData = currentData.map((item) =>
        (item as any)._id === (action.data as any)._id ? action.data : item
      );
      break;
    case 'delete':
      newData = currentData.filter((item) => (item as any)._id !== (action.data as any)._id);
      break;
    default:
      newData = currentData;
  }

  return {
    data: newData as CollectionData[T],
    lastUpdated: action.timestamp,
  };
}

type SyncAction =
  | { type: 'connection'; connected?: boolean; error?: Error }
  | { type: 'data'; event: MessageEvent };

function updateCollectionInState(
  state: DatabaseState,
  action: DatabaseAction<CollectionData[CollectionType][number]>
): DatabaseState {
  const collections = { ...state.collections };
  const collection = action.collection;

  switch (collection) {
    case 'users':
      collections.users = updateCollection(collections.users, action as DatabaseAction<IUser>);
      break;
    case 'votes':
      collections.votes = updateCollection(collections.votes, action as DatabaseAction<IVote>);
      break;
    case 'logos':
      collections.logos = updateCollection(collections.logos, action as DatabaseAction<ILogo>);
      break;
  }

  return { ...state, collections };
}

export function useDbSync() {
  const [state, setState] = useReducer<Reducer<DatabaseState, SyncAction>>((prevState, action) => {
    if (action.type === 'data') {
      try {
        const data = JSON.parse(action.event.data);

        if (data.type === 'error') {
          console.error('Database sync error:', data.error);
          return { ...prevState, error: new Error(data.error) };
        }

        if (data.type === 'heartbeat') {
          // Just update the connection state on heartbeat
          return { ...prevState, connected: true, error: null };
        }

        if (data.type === 'initial' || data.type === 'update') {
          return {
            ...prevState,
            collections: {
              users: { data: data.data.users, lastUpdated: new Date(data.timestamp) },
              votes: { data: data.data.votes, lastUpdated: new Date(data.timestamp) },
              logos: { data: data.data.logos, lastUpdated: new Date(data.timestamp) },
            },
            connected: true,
            error: null,
          };
        }
      } catch (error) {
        console.error('Error processing database sync event:', error);
        return { ...prevState, error: error as Error };
      }
    } else if (action.type === 'connection') {
      return {
        ...prevState,
        connected: action.connected ?? false,
        error: action.error ?? null,
      };
    }
    return prevState;
  }, initialState);

  // Function to check if a port is in use
  const checkPort = useCallback(async (port: number): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:${port}/api/database-info`, {
        method: 'HEAD',
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // Function to find the active Next.js server port
  const findActivePort = useCallback(async (): Promise<number | null> => {
    const ports = [3000, 3001, 3002, 3003, 3004];
    for (const port of ports) {
      if (await checkPort(port)) {
        return port;
      }
    }
    return null;
  }, [checkPort]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isComponentMounted = true;
    let retryTimeout: NodeJS.Timeout | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    const cleanup = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
    };

    const initializeEventSource = async () => {
      cleanup();

      try {
        const port = await findActivePort();

        if (!isComponentMounted) return;

        if (!port) {
          setState({
            type: 'connection',
            connected: false,
            error: new Error('No Next.js server found running on ports 3000-3004'),
          });
          return;
        }

        eventSource = new EventSource(`http://localhost:${port}/api/database-sync`);

        eventSource.onmessage = (event) => {
          if (isComponentMounted) {
            setState({ type: 'data', event });
          }
        };

        eventSource.onopen = () => {
          if (isComponentMounted) {
            setState({ type: 'connection', connected: true });
            retryCount = 0;
          }
        };

        eventSource.onerror = (error) => {
          if (!isComponentMounted) return;

          cleanup();

          if (retryCount < MAX_RETRIES) {
            retryCount++;
            setState({
              type: 'connection',
              connected: false,
              error: new Error(`Connection lost. Retrying (${retryCount}/${MAX_RETRIES})...`),
            });
            retryTimeout = setTimeout(
              initializeEventSource,
              RETRY_DELAY * Math.pow(2, retryCount - 1)
            );
          } else {
            setState({
              type: 'connection',
              connected: false,
              error: new Error(
                'Failed to connect to database sync service after multiple attempts'
              ),
            });
          }
        };
      } catch (error) {
        if (!isComponentMounted) return;

        cleanup();

        if (retryCount < MAX_RETRIES) {
          retryCount++;
          setState({
            type: 'connection',
            connected: false,
            error: new Error(`Connection failed. Retrying (${retryCount}/${MAX_RETRIES})...`),
          });
          retryTimeout = setTimeout(
            initializeEventSource,
            RETRY_DELAY * Math.pow(2, retryCount - 1)
          );
        } else {
          setState({
            type: 'connection',
            connected: false,
            error: error instanceof Error ? error : new Error('Unknown error occurred'),
          });
        }
      }
    };

    initializeEventSource();

    return () => {
      isComponentMounted = false;
      cleanup();
    };
  }, [findActivePort]);

  return state;
}
