import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatSocketClient } from '../../../../../src/pages/chat/socket/ChatSocketClient';
import { FakeWebSocket } from './fake-web-socket';

vi.mock('@exyconn/shell/logging/portalLogger', () => ({ portalLogger: { warn: vi.fn() } }));

function startClient() {
  const client = new ChatSocketClient(
    () => 'wss://api.example.test/chat/ws',
    () => null,
  );
  client.start();
  return client;
}

/** Drops the newest socket and checks the next attempt comes exactly `delay` ms later. */
function expectRetryAfter(delay: number) {
  const before = FakeWebSocket.instances.length;
  FakeWebSocket.latest().close();
  vi.advanceTimersByTime(delay - 1);
  expect(FakeWebSocket.instances).toHaveLength(before);
  vi.advanceTimersByTime(1);
  expect(FakeWebSocket.instances).toHaveLength(before + 1);
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeWebSocket.instances.length = 0;
  vi.stubGlobal('WebSocket', FakeWebSocket);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('ChatSocketClient reconnects', () => {
  it('goes offline when the connection drops and reconnects after a second', () => {
    const client = startClient();
    const onState = vi.fn();
    client.onStateChange(onState);

    FakeWebSocket.latest().close();
    expect(client.state).toBe('offline');
    expect(onState).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    expect(FakeWebSocket.instances).toHaveLength(2);
    expect(client.state).toBe('connecting');
  });

  it('backs off exponentially and never waits longer than 30 seconds', () => {
    startClient();
    for (const delay of [1000, 2000, 4000, 8000, 16_000, 30_000, 30_000]) {
      expectRetryAfter(delay);
    }
  });

  it('starts the backoff over once a connection signs in', () => {
    const client = startClient();
    expectRetryAfter(1000);
    expectRetryAfter(2000);

    const socket = FakeWebSocket.latest();
    socket.open();
    socket.receive(JSON.stringify({ t: 'ready' }));
    expect(client.state).toBe('ready');

    expectRetryAfter(1000);
  });

  it('stops pinging a socket that dropped', () => {
    startClient();
    const socket = FakeWebSocket.latest();
    socket.open();
    socket.close();
    socket.readyState = FakeWebSocket.OPEN;

    vi.advanceTimersByTime(25_000);

    expect(socket.frames()).toEqual([expect.objectContaining({ t: 'hello' })]);
  });

  it('ignores the close of a socket it has already replaced', () => {
    const client = startClient();
    const first = FakeWebSocket.latest();
    client.start();
    expect(FakeWebSocket.instances).toHaveLength(2);

    first.close();
    vi.advanceTimersByTime(60_000);

    expect(client.state).toBe('connecting');
    expect(FakeWebSocket.instances).toHaveLength(2);
  });
});

describe('ChatSocketClient stop', () => {
  it('closes the socket and does not reconnect or go offline', () => {
    const client = startClient();
    const socket = FakeWebSocket.latest();
    socket.open();
    socket.receive(JSON.stringify({ t: 'ready' }));

    client.stop();
    vi.advanceTimersByTime(60_000);

    expect(socket.readyState).toBe(FakeWebSocket.CLOSED);
    expect(client.state).toBe('ready');
    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(socket.frames()).toHaveLength(1);
  });

  it('cancels a reconnect that was waiting', () => {
    const client = startClient();
    FakeWebSocket.latest().close();
    expect(client.state).toBe('offline');

    client.stop();
    vi.advanceTimersByTime(60_000);

    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it('can be stopped before it ever started', () => {
    const client = new ChatSocketClient(
      () => 'wss://api.example.test/chat/ws',
      () => null,
    );
    client.stop();
    expect(FakeWebSocket.instances).toHaveLength(0);
    expect(client.state).toBe('connecting');
  });
});
