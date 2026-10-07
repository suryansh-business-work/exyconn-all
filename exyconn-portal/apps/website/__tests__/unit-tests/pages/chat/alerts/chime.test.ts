import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const logger = vi.hoisted(() => ({ warn: vi.fn() }));

vi.mock('@exyconn/shell/logging/portalLogger', () => ({ portalLogger: logger }));

interface FakeOscillator {
  type: string;
  frequency: { setValueAtTime: ReturnType<typeof vi.fn> };
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

/** A Web Audio context that records the notes it is asked to play. */
class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  static initialState = 'running';
  state = FakeAudioContext.initialState;
  currentTime = 0;
  readonly destination = { name: 'speakers' };
  readonly oscillators: FakeOscillator[] = [];
  readonly gainConnections: unknown[] = [];
  readonly resume = vi.fn(() => Promise.resolve());

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  createOscillator() {
    const oscillator = {
      type: '',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn((gain: unknown) => gain),
      start: vi.fn(),
      stop: vi.fn(),
    };
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn((target: unknown) => this.gainConnections.push(target)),
    };
  }
}

/** A fresh copy of the module, so its cached AudioContext starts empty in every test. */
async function loadChime() {
  return (await import('../../../../../src/pages/chat/alerts/chime')).playChime;
}

const audio = () => FakeAudioContext.instances[0];

describe('playChime', () => {
  beforeEach(() => {
    vi.resetModules();
    logger.warn.mockClear();
    FakeAudioContext.instances = [];
    FakeAudioContext.initialState = 'running';
    vi.stubGlobal('AudioContext', FakeAudioContext);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('plays two short sine notes, E5 then B5, a beat apart', async () => {
    const playChime = await loadChime();
    playChime();

    const [first, second] = audio().oscillators;
    expect(audio().oscillators).toHaveLength(2);
    expect(first.type).toBe('sine');
    expect(first.frequency.setValueAtTime).toHaveBeenCalledWith(659.25, 0);
    expect(first.start).toHaveBeenCalledWith(0);
    expect(first.stop).toHaveBeenCalledWith(0.35);
    expect(second.frequency.setValueAtTime).toHaveBeenCalledWith(987.77, 0.12);
    expect(second.start).toHaveBeenCalledWith(0.12);
    expect(audio().gainConnections).toEqual([audio().destination, audio().destination]);
  });

  it('reuses one audio context for every chime', async () => {
    const playChime = await loadChime();
    playChime();
    playChime();

    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(audio().oscillators).toHaveLength(4);
  });

  it('unlocks suspended audio before playing', async () => {
    FakeAudioContext.initialState = 'suspended';
    const playChime = await loadChime();
    playChime();

    expect(audio().resume).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(audio().oscillators).toHaveLength(2));
  });

  it('stays quiet and logs while the browser keeps audio locked', async () => {
    FakeAudioContext.initialState = 'suspended';
    const playChime = await loadChime();
    const locked = new Error('The page has not been clicked yet');
    playChime();
    await vi.waitFor(() => expect(audio().oscillators).toHaveLength(2));
    audio().resume.mockRejectedValueOnce(locked);
    playChime();

    await vi.waitFor(() =>
      expect(logger.warn).toHaveBeenCalledWith('The chat chime is blocked', locked),
    );
    expect(audio().oscillators).toHaveLength(2);
  });

  it('logs instead of failing where Web Audio is missing', async () => {
    vi.stubGlobal('AudioContext', undefined);
    const playChime = await loadChime();

    expect(() => playChime()).not.toThrow();
    expect(logger.warn).toHaveBeenCalledWith(
      'Could not play the chat chime',
      expect.any(TypeError),
    );
  });
});
