import { MockEventSource } from '@/test/setupMocks/eventSource';

describe('MockEventSource', () => {
  beforeEach(() => {
    MockEventSource.clearInstances();
  });

  it('initializes with correct state', () => {
    const source = new MockEventSource('test-url');
    expect(source.getReadyState()).toBe(MockEventSource.CONNECTING);
    expect(source.getUrl()).toBe('test-url');
  });

  it('handles open event correctly', () => {
    const source = new MockEventSource('test-url');
    const onOpen = jest.fn();
    source.addEventListener('open', onOpen);

    source.emit('open', { type: 'open', data: '' });

    expect(source.getReadyState()).toBe(MockEventSource.CONNECTING);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith({ type: 'open', data: '' });
  });

  it('handles message event correctly', () => {
    const source = new MockEventSource('test-url');
    const onMessage = jest.fn();
    source.addEventListener('message', onMessage);

    const testData = { test: 'data' };
    source.emit('message', { type: 'message', data: JSON.stringify(testData) });

    expect(source.getReadyState()).toBe(MockEventSource.CONNECTING);
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith({
      type: 'message',
      data: JSON.stringify(testData),
    });
  });

  it('handles error event correctly', () => {
    const source = new MockEventSource('test-url');
    const onError = jest.fn();
    source.addEventListener('error', onError);

    source.emit('error', { type: 'error', data: '' });

    expect(source.getReadyState()).toBe(MockEventSource.CONNECTING);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith({ type: 'error', data: '' });
  });

  it('manages event listeners correctly', () => {
    const source = new MockEventSource('test-url');
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    source.addEventListener('message', listener1);
    source.addEventListener('message', listener2);
    source.emit('message', { type: 'message', data: 'test' });

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);

    source.removeEventListener('message', listener1);
    source.emit('message', { type: 'message', data: 'test2' });

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(2);
  });

  it('closes connection correctly', () => {
    const source = new MockEventSource('test-url');
    expect(source.getReadyState()).toBe(MockEventSource.CONNECTING);

    source.close();
    expect(source.getReadyState()).toBe(MockEventSource.CLOSED);
  });

  it('handles multiple instances correctly', () => {
    const source1 = new MockEventSource('url1');
    const source2 = new MockEventSource('url2');

    const onMessage1 = jest.fn();
    const onMessage2 = jest.fn();

    source1.addEventListener('message', onMessage1);
    source2.addEventListener('message', onMessage2);

    source1.emit('message', { type: 'message', data: 'test1' });
    expect(onMessage1).toHaveBeenCalledWith({
      type: 'message',
      data: 'test1',
    });
    expect(onMessage2).not.toHaveBeenCalled();

    source2.emit('message', { type: 'message', data: 'test2' });
    expect(onMessage2).toHaveBeenCalledWith({
      type: 'message',
      data: 'test2',
    });
  });

  it('clears all instances correctly', () => {
    const source1 = new MockEventSource('url1');
    const source2 = new MockEventSource('url2');

    expect(source1.getReadyState()).toBe(MockEventSource.CONNECTING);
    expect(source2.getReadyState()).toBe(MockEventSource.CONNECTING);

    MockEventSource.clearInstances();

    expect(source1.getReadyState()).toBe(MockEventSource.CLOSED);
    expect(source2.getReadyState()).toBe(MockEventSource.CLOSED);
  });

  it('handles initialization with URL object', () => {
    const url = new URL('http://test.com/events');
    const source = new MockEventSource(url);
    expect(source.getUrl()).toBe(url.toString());
  });

  it('handles initialization with options', () => {
    const options = { withCredentials: true };
    const source = new MockEventSource('test-url', options);
    expect(source.getOptions()).toEqual(options);
  });
});
