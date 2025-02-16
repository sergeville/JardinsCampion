import { renderHook, act } from '@testing-library/react';
import { useDbSync } from '@/hooks/useDbSync';
import { MockEventSource } from '@/test/setupMocks/eventSource';

describe('useDbSync Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockEventSource.clearInstances();
  });

  afterEach(() => {
    MockEventSource.clearInstances();
  });

  it('should handle successful data sync', async () => {
    const { result } = renderHook(() => useDbSync());

    await act(async () => {
      const eventSource = (global.EventSource as jest.Mock).mock.results[0]
        .value as MockEventSource;
      eventSource.mockOpen();

      // Simulate initial data
      eventSource.mockMessage({
        schemas: {
          User: {},
          Vote: {},
          Logo: {},
        },
        users: [],
        votes: [],
        logos: [],
        timestamp: new Date().toISOString(),
      });
    });

    expect(result.current.dbState).toEqual({
      schemas: {
        User: {},
        Vote: {},
        Logo: {},
      },
      users: [],
      votes: [],
      logos: [],
      timestamp: expect.any(String),
    });
  });

  it('should establish SSE connection and handle messages', async () => {
    const { result } = renderHook(() => useDbSync());

    await act(async () => {
      const eventSource = (global.EventSource as jest.Mock).mock.results[0]
        .value as MockEventSource;
      eventSource.mockOpen();
    });

    expect(result.current.status).toBe('connected');
    expect(result.current.isLoading).toBe(false);

    const testData = {
      schemas: { User: { test: true } },
      users: [{ id: 1 }],
      votes: [],
      logos: [],
      timestamp: new Date().toISOString(),
    };

    await act(async () => {
      const eventSource = (global.EventSource as jest.Mock).mock.results[0]
        .value as MockEventSource;
      eventSource.mockMessage(testData);
    });

    expect(result.current.dbState).toEqual(testData);
  });

  it('should handle SSE connection errors', async () => {
    const { result } = renderHook(() => useDbSync());

    await act(async () => {
      const eventSource = (global.EventSource as jest.Mock).mock.results[0]
        .value as MockEventSource;
      eventSource.mockError();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBeTruthy();
  });

  it('should clean up SSE connection on unmount', async () => {
    const { unmount } = renderHook(() => useDbSync());
    const eventSource = (global.EventSource as jest.Mock).mock.results[0].value as MockEventSource;

    await act(async () => {
      unmount();
    });

    expect(eventSource.readyState).toBe(MockEventSource.CLOSED);
  });

  it('should handle malformed SSE messages', async () => {
    const { result } = renderHook(() => useDbSync());

    await act(async () => {
      const eventSource = (global.EventSource as jest.Mock).mock.results[0]
        .value as MockEventSource;
      eventSource.mockOpen();
      eventSource.mockMessage('invalid data');
    });

    expect(result.current.error).toBeTruthy();
  });

  it('should maintain previous schema state on partial updates', async () => {
    const { result } = renderHook(() => useDbSync());
    const eventSource = (global.EventSource as jest.Mock).mock.results[0].value as MockEventSource;

    // Initial state
    const initialUserState = [{ id: 1, name: 'Test User' }];
    await act(async () => {
      eventSource.mockOpen();
      eventSource.mockMessage({
        schemas: { User: {} },
        users: initialUserState,
        votes: [],
        logos: [],
        timestamp: new Date().toISOString(),
      });
    });

    // Partial update
    await act(async () => {
      eventSource.mockMessage({
        schemas: { Logo: {} },
        users: initialUserState,
        votes: [],
        logos: [{ id: 1 }],
        timestamp: new Date().toISOString(),
      });
    });

    expect(result.current.dbState?.users).toEqual(initialUserState);
    expect(result.current.dbState?.logos).toBeDefined();
  });

  it('should handle multiple rapid SSE messages', async () => {
    const { result } = renderHook(() => useDbSync());
    const eventSource = (global.EventSource as jest.Mock).mock.results[0].value as MockEventSource;

    await act(async () => {
      eventSource.mockOpen();

      // Send multiple messages rapidly
      for (let i = 0; i < 5; i++) {
        eventSource.mockMessage({
          schemas: { User: {} },
          users: Array(i + 1).fill({ id: i }),
          votes: [],
          logos: [],
          timestamp: new Date().toISOString(),
        });
      }
    });

    expect(result.current.dbState?.users).toHaveLength(5);
  });

  it('should handle reconnection attempts', async () => {
    const { result } = renderHook(() => useDbSync());
    const eventSource = (global.EventSource as jest.Mock).mock.results[0].value as MockEventSource;

    await act(async () => {
      eventSource.mockError();
      eventSource.mockOpen();
    });

    expect(result.current.status).toBe('connected');
  });
});
