import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CallingBotChannel, CallingBotTurnRole } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useBrowserCall } from '../../../src/call/useBrowserCall';
import { renderHookWithProviders } from '../test-utils';

const mocks = vi.hoisted(() => ({
  startCall: vi.fn(),
  openMicrophone: vi.fn(),
  microphone: { stop: vi.fn() },
  player: { play: vi.fn(), clear: vi.fn(), close: vi.fn() },
  frame: null as ((frame: ArrayBuffer) => void) | null,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useStartCallingBotCallMutation: () => [mocks.startCall],
}));
vi.mock('../../../src/audio/microphone', () => ({ openMicrophone: mocks.openMicrophone }));
vi.mock('../../../src/audio/player', () => ({
  PcmPlayer: vi.fn(function PcmPlayer() {
    return mocks.player;
  }),
}));

/** The browser's WebSocket, driven by the test. */
class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static last: FakeWebSocket | null = null;
  readyState = FakeWebSocket.CONNECTING;
  binaryType = 'blob';
  onopen: (() => void) | null = null;
  onmessage: ((message: { data: ArrayBuffer | string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readonly send = vi.fn();
  readonly close = vi.fn();
  constructor(readonly url: string) {
    FakeWebSocket.last = this;
  }
}

const socket = () => {
  if (!FakeWebSocket.last) {
    throw new Error('No socket was opened');
  }
  return FakeWebSocket.last;
};

const started = (socketUrl: string | null) => ({
  data: { startCallingBotCall: { socketUrl, call: { id: 'call-1' } } },
});

async function callStarted(scenarioId: string | null = 'scenario-1') {
  const hook = renderHookWithProviders(() => useBrowserCall(scenarioId));
  await act(async () => {
    await hook.result.current.start();
  });
  return hook;
}

describe('a call from this browser', () => {
  beforeEach(() => {
    FakeWebSocket.last = null;
    vi.stubGlobal('WebSocket', FakeWebSocket);
    mocks.openMicrophone.mockImplementation(async (onFrame: (frame: ArrayBuffer) => void) => {
      mocks.frame = onFrame;
      return mocks.microphone;
    });
    mocks.startCall.mockResolvedValue(started('wss://voice.test/browser?ticket=t1'));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('is idle until the caller presses call', () => {
    const { result } = renderHookWithProviders(() => useBrowserCall(null));
    expect(result.current).toMatchObject({ phase: 'idle', lines: [], error: null, startedAt: null });
  });

  it('asks for a browser call with the picked example and connects to its socket', async () => {
    const { result } = await callStarted();
    expect(mocks.startCall).toHaveBeenCalledWith({
      variables: { input: { channel: CallingBotChannel.Browser, scenarioId: 'scenario-1' } },
    });
    expect(socket().url).toBe('wss://voice.test/browser?ticket=t1');
    expect(socket().binaryType).toBe('arraybuffer');
    expect(result.current.phase).toBe('connecting');
    act(() => socket().onopen?.());
    expect(result.current.phase).toBe('live');
    expect(result.current.startedAt).toEqual(expect.any(Number));
  });

  it('sends microphone frames only while the socket is open', async () => {
    await callStarted();
    const frame = new ArrayBuffer(640);
    mocks.frame?.(frame);
    expect(socket().send).not.toHaveBeenCalled();
    socket().readyState = FakeWebSocket.OPEN;
    mocks.frame?.(frame);
    expect(socket().send).toHaveBeenCalledWith(frame);
  });

  it('drops a frame captured before the call has a socket', async () => {
    let finishStart: (value: unknown) => void = () => undefined;
    mocks.startCall.mockReturnValueOnce(new Promise((resolve) => (finishStart = resolve)));
    const { result } = renderHookWithProviders(() => useBrowserCall(null));
    let starting: Promise<void> = Promise.resolve();
    act(() => {
      starting = result.current.start();
    });
    await vi.waitFor(() => {
      expect(mocks.frame).not.toBeNull();
    });
    expect(() => mocks.frame?.(new ArrayBuffer(2))).not.toThrow();
    await act(async () => {
      finishStart(started('wss://voice.test/browser'));
      await starting;
    });
    expect(socket().send).not.toHaveBeenCalled();
  });

  it("plays the bot's voice, lists each turn and stops the voice on clear", async () => {
    const { result } = await callStarted();
    const audio = new ArrayBuffer(4);
    act(() => {
      socket().onmessage?.({ data: audio });
      socket().onmessage?.({ data: JSON.stringify({ type: 'turn', role: 'BOT', text: 'Hello' }) });
      socket().onmessage?.({ data: JSON.stringify({ type: 'turn', role: 'CALLER', text: 'Hi' }) });
      socket().onmessage?.({ data: JSON.stringify({ type: 'clear' }) });
    });
    expect(mocks.player.play).toHaveBeenCalledWith(audio);
    expect(mocks.player.clear).toHaveBeenCalled();
    expect(result.current.lines).toEqual([
      { key: 'line-1', role: CallingBotTurnRole.Bot, text: 'Hello' },
      { key: 'line-2', role: CallingBotTurnRole.Caller, text: 'Hi' },
    ]);
  });

  it('ends quietly when the bot hangs up, keeping the first reason only', async () => {
    const { result } = await callStarted();
    socket().readyState = FakeWebSocket.OPEN;
    act(() => {
      socket().onmessage?.({ data: JSON.stringify({ type: 'ended', reason: 'Time limit', failed: false }) });
      socket().onerror?.();
    });
    expect(result.current).toMatchObject({ phase: 'ended', error: null });
    expect(mocks.microphone.stop).toHaveBeenCalledTimes(1);
    expect(mocks.player.close).toHaveBeenCalledTimes(1);
    expect(socket().close).toHaveBeenCalledTimes(1);
  });

  it('logs a failed call for Tech and tells the caller to try later', async () => {
    const error = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    const { result } = await callStarted();
    act(() => {
      socket().onmessage?.({
        data: JSON.stringify({ type: 'ended', reason: 'Sarvam refused the key', failed: true }),
      });
    });
    expect(error).toHaveBeenCalledWith('Calling bot call failed', undefined, {
      reason: 'Sarvam refused the key',
    });
    expect(result.current.error).toBe(
      'The bot could not take the call right now. Please try again in a few minutes.',
    );
  });

  it('reports a dropped line', async () => {
    const { result } = await callStarted();
    act(() => socket().onerror?.());
    expect(result.current).toMatchObject({ phase: 'ended', error: 'The call dropped. Try again.' });
  });

  it('ends without an error when the socket closes', async () => {
    const { result } = await callStarted();
    socket().readyState = FakeWebSocket.CLOSED;
    act(() => socket().onclose?.());
    expect(result.current).toMatchObject({ phase: 'ended', error: null });
    expect(socket().close).not.toHaveBeenCalled();
  });

  it('says hangup to the server before ending the call', async () => {
    const { result } = await callStarted();
    socket().readyState = FakeWebSocket.OPEN;
    act(() => result.current.hangUp());
    expect(socket().send).toHaveBeenCalledWith(JSON.stringify({ type: 'hangup' }));
    expect(result.current.phase).toBe('ended');
  });

  it('just ends when hanging up before the socket opened', async () => {
    const { result } = await callStarted();
    act(() => result.current.hangUp());
    expect(socket().send).not.toHaveBeenCalled();
    expect(result.current.phase).toBe('ended');
  });

  it('hangs up with nothing open when no call was started', () => {
    const { result } = renderHookWithProviders(() => useBrowserCall(null));
    act(() => result.current.hangUp());
    expect(result.current.phase).toBe('ended');
  });

  it('asks the caller to allow the microphone when it cannot be opened', async () => {
    mocks.openMicrophone.mockRejectedValueOnce('denied');
    const { result } = await callStarted();
    expect(mocks.player.close).toHaveBeenCalled();
    expect(mocks.startCall).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({
      phase: 'ended',
      error: 'Allow the microphone, then try again.',
    });
  });

  it('explains a call the server would not start', async () => {
    mocks.startCall.mockResolvedValueOnce(started(null));
    const { result } = await callStarted();
    expect(result.current.error).toBe('The call could not be started.');
    expect(mocks.microphone.stop).toHaveBeenCalled();
    mocks.startCall.mockResolvedValueOnce({ data: null });
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.error).toBe('The call could not be started.');
  });

  it('starts a fresh call after one ended', async () => {
    const { result } = await callStarted();
    act(() => socket().onerror?.());
    await act(async () => {
      await result.current.start();
    });
    expect(result.current).toMatchObject({ phase: 'connecting', error: null, lines: [] });
  });

  it('closes the microphone when the page is left mid-call', async () => {
    const { unmount } = await callStarted();
    unmount();
    expect(mocks.microphone.stop).toHaveBeenCalled();
    expect(socket().close).toHaveBeenCalled();
  });
});
