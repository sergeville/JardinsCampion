import { MockEventSource } from '@/test/setupMocks/eventSource';

describe('MockEventSource', () => {
  beforeEach(() => {
    MockEventSource.clearInstances();
  });

  it('initializes with correct state', () => {
    const source = new MockEventSource('test-url');
    expect(source.readyState).toBe(MockEventSource.CONNECTING);
    expect(source.onopen).toBeNull();
    expect(source.onmessage).toBeNull();
    expect(source.onerror).toBeNull();
  });

  it('handles open event correctly', () => {
    const source = new MockEventSource('test-url');
    const onOpen = jest.fn();
    source.onopen = onOpen;
    source.addEventListener('open', onOpen);

    source.mockOpen();

    expect(source.readyState).toBe(MockEventSource.OPEN);
    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(onOpen).toHaveBeenCalledWith({ type: 'open' });
  });

  it('handles message event correctly', () => {
    const source = new MockEventSource('test-url');
    const onMessage = jest.fn();
    source.onmessage = onMessage;
    source.addEventListener('message', onMessage);

    const testData = { test: 'data' };
    source.mockMessage(testData);

    expect(source.readyState).toBe(MockEventSource.OPEN);
    expect(onMessage).toHaveBeenCalledTimes(2);
    expect(onMessage).toHaveBeenCalledWith({
      type: 'message',
      data: JSON.stringify(testData),
    });
  });

  it('handles error event correctly', () => {
    const source = new MockEventSource('test-url');
    const onError = jest.fn();
    source.onerror = onError;
    source.addEventListener('error', onError);

    source.mockError();

    expect(source.readyState).toBe(MockEventSource.CLOSED);
    expect(onError).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledWith({ type: 'error' });
  });

  it('manages event listeners correctly', () => {
    const source = new MockEventSource('test-url');
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    source.addEventListener('message', listener1);
    source.addEventListener('message', listener2);
    source.mockMessage('test');

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);

    source.removeEventListener('message', listener1);
    source.mockMessage('test2');

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(2);
  });

  it('closes connection correctly', () => {
    const source = new MockEventSource('test-url');
    source.mockOpen();
    expect(source.readyState).toBe(MockEventSource.OPEN);

    source.close();
    expect(source.readyState).toBe(MockEventSource.CLOSED);
  });

  it('handles multiple instances correctly', () => {
    const source1 = new MockEventSource('url1');
    const source2 = new MockEventSource('url2');

    const onMessage1 = jest.fn();
    const onMessage2 = jest.fn();

    source1.onmessage = onMessage1;
    source2.onmessage = onMessage2;

    source1.mockMessage('test1');
    expect(onMessage1).toHaveBeenCalledWith({
      type: 'message',
      data: 'test1',
    });
    expect(onMessage2).not.toHaveBeenCalled();

    source2.mockMessage('test2');
    expect(onMessage2).toHaveBeenCalledWith({
      type: 'message',
      data: 'test2',
    });
  });

  it('clears all instances correctly', () => {
    const source1 = new MockEventSource('url1');
    const source2 = new MockEventSource('url2');

    source1.mockOpen();
    source2.mockOpen();

    expect(source1.readyState).toBe(MockEventSource.OPEN);
    expect(source2.readyState).toBe(MockEventSource.OPEN);

    MockEventSource.clearInstances();

    expect(source1.readyState).toBe(MockEventSource.CLOSED);
    expect(source2.readyState).toBe(MockEventSource.CLOSED);
  });
});
