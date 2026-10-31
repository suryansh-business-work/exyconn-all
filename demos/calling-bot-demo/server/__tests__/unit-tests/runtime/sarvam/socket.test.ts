import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeWebSocket } from '../../fakeWs';
import { log } from '../../../../src/runtime/log';
import { SarvamSocket } from '../../../../src/runtime/sarvam/socket';

vi.mock('ws', async () => ({ default: (await import('../../fakeWs.js')).FakeWebSocket }));
vi.mock('../../../../src/runtime/log', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  errorText: (error: unknown) => (error instanceof Error ? error.message : String(error)),
}));


const HINT = 'Check the Sarvam AI key and its credits in Agents > Calling bot.';

function open() {
  const events = { onMessage: vi.fn(), onFailure: vi.fn() };
  const sarvam = new SarvamSocket(
    'Sarvam test',
    'wss://sarvam.test/ws',
    { 'API-SUBSCRIPTION-KEY': 'sarvam-test-key' },
    { event: 'ping' },
    events,
  );
  return { sarvam, events, socket: FakeWebSocket.last() };
}

describe('a Sarvam socket', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('connects with the key header and holds messages until the socket opens', () => {
    const { sarvam, socket } = open();
    expect(socket.url).toBe('wss://sarvam.test/ws');
    expect(socket.options.headers).toEqual({ 'API-SUBSCRIPTION-KEY': 'sarvam-test-key' });
    sarvam.send({ n: 1 });
    sarvam.send({ n: 2 });
    expect(socket.send).not.toHaveBeenCalled();
    socket.open();
    sarvam.send({ n: 3 });
    expect(socket.sentJson()).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
  });

  it('drops messages once the socket is closed', () => {
    const { sarvam, socket } = open();
    socket.readyState = FakeWebSocket.CLOSED;
    sarvam.send({ n: 1 });
    expect(socket.send).not.toHaveBeenCalled();
  });

  it('pings every 20 seconds and stops pinging once closed', () => {
    const { sarvam, socket } = open();
    socket.open();
    vi.advanceTimersByTime(40_000);
    expect(socket.sentJson()).toEqual([{ event: 'ping' }, { event: 'ping' }]);
    sarvam.close();
    vi.advanceTimersByTime(40_000);
    expect(socket.send).toHaveBeenCalledTimes(2);
  });

  it('hands over every JSON message and logs one it cannot read', () => {
    const { events, socket } = open();
    socket.deliver('{"event":"vad.speech_start"}');
    socket.deliver('not json');
    expect(events.onMessage).toHaveBeenCalledWith({ event: 'vad.speech_start' });
    expect(events.onMessage).toHaveBeenCalledTimes(1);
    expect(log.warn).toHaveBeenCalledWith('unreadable sarvam message', {
      error: expect.any(String),
    });
  });

  it('reports a refused handshake with the hint to check the key', () => {
    const { events, socket } = open();
    socket.emit('error', new Error('Unexpected server response: 403'));
    socket.emit('close', 1006, Buffer.from(''));
    expect(log.warn).toHaveBeenCalledWith('sarvam socket error', {
      service: 'Sarvam test',
      error: 'Unexpected server response: 403',
    });
    expect(events.onFailure).toHaveBeenCalledWith(
      `Sarvam test closed the connection (1006: Unexpected server response: 403). ${HINT}`,
    );
  });

  it("gives Sarvam's own reason for a refused key", () => {
    const { events, socket } = open();
    socket.emit('close', 1003, Buffer.from('Invalid API key'));
    expect(events.onFailure).toHaveBeenCalledWith(
      `Sarvam test closed the connection (1003: Invalid API key). ${HINT}`,
    );
  });

  it('reports a bare close code without a hint when nothing else is known', () => {
    const { events, socket } = open();
    socket.emit('close', 1011, Buffer.from(''));
    expect(events.onFailure).toHaveBeenCalledWith('Sarvam test closed the connection (1011).');
  });

  it('does not count a close it asked for as a failure, and closes once', () => {
    const { sarvam, events, socket } = open();
    socket.open();
    sarvam.close({ event: 'end' });
    sarvam.close({ event: 'end' });
    socket.emit('close', 1000, Buffer.from(''));
    expect(socket.sentJson()).toEqual([{ event: 'end' }]);
    expect(socket.close).toHaveBeenCalledTimes(1);
    expect(events.onFailure).not.toHaveBeenCalled();
  });

  it('skips the farewell when the socket never opened', () => {
    const { sarvam, socket } = open();
    sarvam.close({ event: 'end' });
    expect(socket.send).not.toHaveBeenCalled();
    expect(socket.close).toHaveBeenCalledTimes(1);
  });

  it('closes without a farewell when none is given', () => {
    const { sarvam, socket } = open();
    socket.open();
    sarvam.close();
    expect(socket.send).not.toHaveBeenCalled();
    expect(socket.close).toHaveBeenCalledTimes(1);
  });
});
