import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// Mock fetch and Response
global.fetch = jest.fn();
global.Response = jest.fn() as any;
global.Request = jest.fn() as any;

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock EventSource
class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  url: string;
  readyState: number;
  onopen: ((event: any) => void) | null;
  onmessage: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  private listeners: { [key: string]: ((event: any) => void)[] };

  constructor(url: string) {
    this.url = url;
    this.readyState = MockEventSource.CONNECTING;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.listeners = {};
  }

  addEventListener(type: string, listener: (event: any) => void) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: (event: any) => void) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter(l => l !== listener);
  }

  mockOpen() {
    this.readyState = MockEventSource.OPEN;
    if (this.onopen) this.onopen({});
    if (this.listeners.open) {
      this.listeners.open.forEach(listener => listener({}));
    }
  }

  mockMessage(data: any) {
    const event = {
      type: 'message',
      data: data,
      origin: window.location.origin,
      lastEventId: '',
      source: null,
      ports: []
    };
    if (this.onmessage) this.onmessage(event);
    if (this.listeners.message) {
      this.listeners.message.forEach(listener => listener(event));
    }
  }

  mockError() {
    this.readyState = MockEventSource.CLOSED;
    if (this.onerror) this.onerror({});
    if (this.listeners.error) {
      this.listeners.error.forEach(listener => listener({}));
    }
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
  }
}

global.EventSource = MockEventSource as any;

// Mock environment variables
process.env.MONGODB_URI_DEV = 'mongodb://localhost:27017/test';
process.env.MONGODB_URI_PROD = 'mongodb://localhost:27017/test';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
}); 