import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { PcmPlayer } from '../../../src/audio/player';

interface FakeSource {
  buffer: { duration: number } | null;
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  onended: (() => void) | null;
}

/** The parts of an AudioContext the player uses, recording what it schedules. */
class FakeAudioContext {
  static last: FakeAudioContext;
  currentTime = 0;
  readonly destination = { kind: 'speaker' };
  readonly sources: FakeSource[] = [];
  readonly channels: Float32Array[] = [];
  readonly close = vi.fn().mockResolvedValue(undefined);

  constructor() {
    FakeAudioContext.last = this;
  }

  createBuffer(channels: number, length: number, rate: number) {
    const data = new Float32Array(length);
    this.channels.push(data);
    return { channels, rate, duration: length / rate, getChannelData: () => data };
  }

  createBufferSource(): FakeSource {
    const source: FakeSource = {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    };
    this.sources.push(source);
    return source;
  }
}

const pcm = (...samples: number[]) => new Int16Array(samples).buffer;

describe("the bot's voice player", () => {
  beforeEach(() => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('plays each 16 kHz chunk right after the one before, without gaps', () => {
    const player = new PcmPlayer();
    const context = FakeAudioContext.last;
    context.currentTime = 1;
    player.play(new Int16Array(1600).buffer);
    player.play(new Int16Array(800).buffer);
    const [first, second] = context.sources;
    expect(first.connect).toHaveBeenCalledWith(context.destination);
    expect(first.start).toHaveBeenCalledWith(1);
    expect(second.start).toHaveBeenCalledWith(1.1);
  });

  it('turns 16-bit samples into floats between -1 and 1', () => {
    const player = new PcmPlayer();
    player.play(pcm(-32768, 0, 16384));
    expect(Array.from(FakeAudioContext.last.channels[0])).toEqual([-1, 0, 0.5]);
  });

  it('skips an empty chunk', () => {
    const player = new PcmPlayer();
    player.play(new ArrayBuffer(0));
    expect(FakeAudioContext.last.sources).toHaveLength(0);
  });

  it('starts again from now once everything queued was cleared', () => {
    const player = new PcmPlayer();
    const context = FakeAudioContext.last;
    player.play(new Int16Array(16000).buffer);
    player.play(new Int16Array(16000).buffer);
    context.sources[0].onended?.();
    player.clear();
    expect(context.sources[0].stop).not.toHaveBeenCalled();
    expect(context.sources[1].stop).toHaveBeenCalled();
    context.currentTime = 0.5;
    player.play(new Int16Array(160).buffer);
    expect(context.sources[2].start).toHaveBeenCalledWith(0.5);
  });

  it('stops and releases the speaker on close, logging a failed release', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const player = new PcmPlayer();
    const context = FakeAudioContext.last;
    player.play(new Int16Array(160).buffer);
    context.close.mockRejectedValueOnce(new Error('already closed'));
    player.close();
    expect(context.sources[0].stop).toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(warn).toHaveBeenCalledWith('Could not close the speaker', expect.any(Error));
    });
  });
});
