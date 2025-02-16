interface EventSourceEvent {
  type: string;
  data: string;
  lastEventId?: string;
  origin?: string;
}

type EventSourceListener = (event: EventSourceEvent) => void;

interface EventSourceInit {
  withCredentials?: boolean;
}

interface EventSourceConstructor {
  new (url: string | URL, eventSourceInitDict?: EventSourceInit): EventSource;
  readonly CONNECTING: 0;
  readonly OPEN: 1;
  readonly CLOSED: 2;
  prototype: EventSource;
}

declare global {
  interface Window {
    EventSource: EventSourceConstructor;
  }
}

export class MockEventSource {
  private static instances: Set<MockEventSource> = new Set();

  private listeners: Record<string, EventSourceListener[]> = {
    message: [],
    error: [],
    open: [],
  };
  private readyState: 0 | 1 | 2 = 0; // CONNECTING
  private url: string;
  private options?: EventSourceInit;

  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  constructor(url: string | URL, options?: EventSourceInit) {
    this.url = url.toString();
    this.options = options;
    MockEventSource.instances.add(this);
  }

  addEventListener(type: string, listener: EventSourceListener): void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: EventSourceListener): void {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
    }
  }

  close(): void {
    this.readyState = 2; // CLOSED
    MockEventSource.instances.delete(this);
  }

  // Helper methods for testing
  emit(type: string, event: EventSourceEvent): void {
    if (this.listeners[type]) {
      this.listeners[type].forEach((listener) => listener(event));
    }
  }

  getUrl(): string {
    return this.url;
  }

  getOptions(): EventSourceInit | undefined {
    return this.options;
  }

  getReadyState(): number {
    return this.readyState;
  }

  static clearInstances(): void {
    const instances = Array.from(MockEventSource.instances);
    instances.forEach((instance) => instance.close());
    MockEventSource.instances.clear();
  }
}

// Set up global EventSource mock
global.EventSource = jest
  .fn()
  .mockImplementation(
    (url: string | URL, options?: EventSourceInit) => new MockEventSource(url, options)
  ) as unknown as EventSourceConstructor;
