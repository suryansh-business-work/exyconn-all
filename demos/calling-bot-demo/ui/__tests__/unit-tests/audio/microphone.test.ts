import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { openMicrophone } from '../../../src/audio/microphone';

const track = { stop: vi.fn() };
const stream = { getTracks: () => [track] };
const source = { connect: vi.fn(), disconnect: vi.fn() };

class FakeAudioContext {
  static last: FakeAudioContext;
  readonly resume = vi.fn().mockResolvedValue(undefined);
  readonly close = vi.fn().mockResolvedValue(undefined);
  readonly audioWorklet = { addModule: vi.fn().mockResolvedValue(undefined) };
  readonly createMediaStreamSource = vi.fn(() => source);
  constructor() {
    FakeAudioContext.last = this;
  }
}

class FakeWorkletNode {
  static last: FakeWorkletNode;
  readonly port: { onmessage: ((event: MessageEvent<ArrayBuffer>) => void) | null } = {
    onmessage: null,
  };
  constructor(
    readonly context: FakeAudioContext,
    readonly name: string,
  ) {
    FakeWorkletNode.last = this;
  }
}

describe('the microphone', () => {
  const getUserMedia = vi.fn();

  beforeEach(() => {
    getUserMedia.mockResolvedValue(stream);
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('AudioWorkletNode', FakeWorkletNode);
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('opens with echo cancellation and hands over every frame the worklet posts', async () => {
    const onFrame = vi.fn();
    await openMicrophone(onFrame);
    const context = FakeAudioContext.last;
    expect(getUserMedia).toHaveBeenCalledWith({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    expect(context.resume).toHaveBeenCalled();
    expect(context.audioWorklet.addModule).toHaveBeenCalledWith(
      expect.stringContaining('mic-frames.worklet'),
    );
    expect(FakeWorkletNode.last.name).toBe('mic-frames');
    expect(source.connect).toHaveBeenCalledWith(FakeWorkletNode.last);
    const frame = new ArrayBuffer(640);
    FakeWorkletNode.last.port.onmessage?.({ data: frame } as MessageEvent<ArrayBuffer>);
    expect(onFrame).toHaveBeenCalledWith(frame);
  });

  it('releases the device, the graph and the context on stop', async () => {
    const microphone = await openMicrophone(vi.fn());
    microphone.stop();
    expect(FakeWorkletNode.last.port.onmessage).toBeNull();
    expect(source.disconnect).toHaveBeenCalled();
    expect(track.stop).toHaveBeenCalled();
    expect(FakeAudioContext.last.close).toHaveBeenCalled();
  });

  it('logs a context that cannot be closed', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const microphone = await openMicrophone(vi.fn());
    FakeAudioContext.last.close.mockRejectedValueOnce(new Error('closed'));
    microphone.stop();
    await vi.waitFor(() => {
      expect(warn).toHaveBeenCalledWith('Could not close the microphone', expect.any(Error));
    });
  });

  it('fails when the caller refuses the microphone', async () => {
    getUserMedia.mockRejectedValueOnce(new Error('NotAllowedError'));
    await expect(openMicrophone(vi.fn())).rejects.toThrow('NotAllowedError');
  });
});
