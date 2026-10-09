// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

/** A stand-in <audio>: jsdom cannot play sound. */
const fakeAudio = {
  all: [] as FakeAudio[],
  play: (): Promise<void> => Promise.resolve(),
};

class FakeAudio {
  preload = '';
  currentTime = 12;
  readonly listeners = new Map<string, () => void>();
  readonly play = vi.fn(() => fakeAudio.play());
  constructor(readonly src: string) {
    fakeAudio.all.push(this);
  }
  addEventListener(type: string, fn: () => void): void {
    this.listeners.set(type, fn);
  }
}

let warn: MockInstance;

/** The element is module state, so each case loads the module afresh. */
async function load() {
  vi.resetModules();
  return import('../../../src/renderer/shutter');
}

beforeEach(() => {
  fakeAudio.all = [];
  fakeAudio.play = () => Promise.resolve();
  vi.stubGlobal('Audio', FakeAudio);
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  warn.mockRestore();
});

describe('playShutter', () => {
  it('builds the bundled shutter once, preloaded, and plays it from the start every time', async () => {
    const { playShutter } = await load();

    playShutter();
    const [audio] = fakeAudio.all;
    expect(audio.src).toContain('camera-sound');
    expect(audio.preload).toBe('auto');
    expect(audio.currentTime).toBe(0);

    audio.currentTime = 0.4;
    playShutter();
    expect(fakeAudio.all).toHaveLength(1);
    expect(audio.currentTime).toBe(0);
    expect(audio.play).toHaveBeenCalledTimes(2);
  });

  it('warns, and never rejects unhandled, when the browser refuses to play', async () => {
    const blocked = new Error('NotAllowedError');
    fakeAudio.play = () => Promise.reject(blocked);
    const { playShutter } = await load();

    playShutter();

    await vi.waitFor(() =>
      expect(warn).toHaveBeenCalledWith('Camera shutter sound could not play', blocked),
    );
  });

  it('warns when play throws outright', async () => {
    const broken = new Error('not supported');
    fakeAudio.play = () => {
      throw broken;
    };
    const { playShutter } = await load();

    expect(() => playShutter()).not.toThrow();
    expect(warn).toHaveBeenCalledWith('Camera shutter sound could not play', broken);
  });

  it('stops trying once the file has failed to load', async () => {
    const { playShutter } = await load();
    playShutter();
    const [audio] = fakeAudio.all;

    audio.listeners.get('error')?.();
    playShutter();

    expect(warn).toHaveBeenCalledWith(
      'Camera shutter sound could not be loaded; captures stay silent.',
    );
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(fakeAudio.all).toHaveLength(1);
  });
});
