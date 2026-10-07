import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { ChatSocketClient } from '../../../../../src/pages/chat/socket/ChatSocketClient';
import { FakeWebSocket } from './fake-web-socket';

vi.mock('@exyconn/shell/logging/portalLogger', () => ({ portalLogger: { warn: vi.fn() } }));

const SOCKET_URL = 'wss://api.example.test/chat/ws';
/** Built at runtime so no credential-looking literal sits in the source. */
const portalToken = ['portal', 'session', 'value'].join('-');

function startClient(token: string | null = portalToken) {
  const client = new ChatSocketClient(
    () => SOCKET_URL,
    () => token,
  );
  client.start();
  return { client, socket: FakeWebSocket.latest() };
}

/** Starts a client and walks it through sign-in, so it is live. */
function readyClient() {
  const started = startClient();
  started.socket.open();
  started.socket.receive(JSON.stringify({ t: 'ready' }));
  return started;
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeWebSocket.instances.length = 0;
  vi.stubGlobal('WebSocket', FakeWebSocket);
  vi.mocked(portalLogger.warn).mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('ChatSocketClient sign-in', () => {
  it('opens the socket at the given url and signs in as staff with the portal token', () => {
    const { client, socket } = startClient();
    expect(socket.url).toBe(SOCKET_URL);
    expect(client.state).toBe('connecting');

    socket.open();

    expect(socket.frames()).toEqual([{ t: 'hello', role: 'staff', token: portalToken }]);
  });

  it('signs in with an empty token when the portal has none', () => {
    const { socket } = startClient(null);
    socket.open();
    expect(socket.frames()).toEqual([{ t: 'hello', role: 'staff', token: '' }]);
  });

  it('pings every 25 seconds while the socket is open, and not once it is not', () => {
    const { socket } = startClient();
    socket.open();

    vi.advanceTimersByTime(24_999);
    expect(socket.frames()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(socket.frames()).toEqual([expect.objectContaining({ t: 'hello' }), { t: 'ping' }]);

    socket.readyState = FakeWebSocket.CLOSING;
    vi.advanceTimersByTime(25_000);
    expect(socket.frames()).toHaveLength(2);
  });

  it('goes live on "ready" and tells state listeners only when the state really changes', () => {
    const { client, socket } = startClient();
    const onState = vi.fn();
    client.onStateChange(onState);

    socket.open();
    expect(onState).not.toHaveBeenCalled();
    socket.receive(JSON.stringify({ t: 'ready' }));
    socket.receive(JSON.stringify({ t: 'ready' }));

    expect(client.state).toBe('ready');
    expect(onState).toHaveBeenCalledTimes(1);
  });

  it('stops telling a state listener once it unsubscribes', () => {
    const { client, socket } = startClient();
    const onState = vi.fn();
    const unsubscribe = client.onStateChange(onState);
    unsubscribe();

    socket.open();
    socket.receive(JSON.stringify({ t: 'ready' }));

    expect(client.state).toBe('ready');
    expect(onState).not.toHaveBeenCalled();
  });

  it('logs socket errors', () => {
    const { socket } = startClient();
    socket.onerror?.();
    expect(portalLogger.warn).toHaveBeenCalledWith('Website chat socket error');
  });
});

describe('ChatSocketClient frames', () => {
  it('hands every server frame to its subscribers until they unsubscribe', () => {
    const { client, socket } = readyClient();
    const listener = vi.fn();
    const unsubscribe = client.subscribe(listener);

    socket.receive(JSON.stringify({ t: 'pong' }));
    unsubscribe();
    socket.receive(JSON.stringify({ t: 'pong' }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ t: 'pong' });
  });

  it('ignores data that is not a frame and logs data that is not JSON', () => {
    const { client, socket } = readyClient();
    const listener = vi.fn();
    client.subscribe(listener);

    socket.receive(new ArrayBuffer(4));
    socket.receive('null');
    socket.receive('42');
    socket.receive(JSON.stringify({ kind: 'pong' }));
    socket.receive('{not json');

    expect(listener).not.toHaveBeenCalled();
    expect(portalLogger.warn).toHaveBeenCalledWith(
      'Website chat sent a frame that is not JSON',
      expect.any(SyntaxError),
    );
  });

  it('sends a frame once live and reports true', () => {
    const { client, socket } = readyClient();
    const sent = client.send({ t: 'read', sessionId: 's1' });
    expect(sent).toBe(true);
    expect(socket.frames().at(-1)).toEqual({ t: 'read', sessionId: 's1' });
  });

  it('refuses to send before sign-in finishes', () => {
    const { client, socket } = startClient();
    socket.open();
    expect(client.send({ t: 'watch', sessionId: null })).toBe(false);
    expect(socket.frames()).toHaveLength(1);
  });

  it('refuses to send when the live socket is no longer open', () => {
    const { client, socket } = readyClient();
    socket.readyState = FakeWebSocket.CLOSING;
    expect(client.send({ t: 'typing', sessionId: 's1', on: true })).toBe(false);
  });

  it('closes and retries when the server refuses the sign-in, still passing the error on', () => {
    const { client, socket } = startClient();
    const listener = vi.fn();
    client.subscribe(listener);
    socket.open();

    socket.receive(JSON.stringify({ t: 'error', message: 'No access' }));

    expect(portalLogger.warn).toHaveBeenCalledWith('Website chat refused the console', {
      message: 'No access',
    });
    expect(socket.readyState).toBe(FakeWebSocket.CLOSED);
    expect(client.state).toBe('offline');
    expect(listener).toHaveBeenCalledWith({ t: 'error', message: 'No access' });
  });

  it('keeps the socket open on an error after sign-in (a failed send, not a refusal)', () => {
    const { client, socket } = readyClient();
    socket.receive(JSON.stringify({ t: 'error', message: 'Too big', clientId: 'c1' }));
    expect(socket.readyState).toBe(FakeWebSocket.OPEN);
    expect(client.state).toBe('ready');
    expect(portalLogger.warn).not.toHaveBeenCalled();
  });
});
