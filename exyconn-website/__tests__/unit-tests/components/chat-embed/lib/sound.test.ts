/** The two-note chime: no audio until the visitor has clicked, then two sine notes. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const contexts: FakeAudioContext[] = [];

function fakeOscillator() {
  const oscillator = {
    type: "",
    frequency: { value: 0 },
    connect: vi.fn((node: unknown) => node),
    start: vi.fn(),
    stop: vi.fn(),
  };
  return oscillator;
}

function fakeGain() {
  return {
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  };
}

class FakeAudioContext {
  static resumeFails = false;
  readonly currentTime = 2;
  readonly destination = { name: "speakers" };
  readonly oscillators: ReturnType<typeof fakeOscillator>[] = [];
  readonly gains: ReturnType<typeof fakeGain>[] = [];
  readonly resume = vi.fn(() =>
    FakeAudioContext.resumeFails ? Promise.reject(new Error("blocked")) : Promise.resolve()
  );

  constructor() {
    contexts.push(this);
  }

  createOscillator() {
    const oscillator = fakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain() {
    const gain = fakeGain();
    this.gains.push(gain);
    return gain;
  }
}

/** A fresh copy of the module, since it keeps its audio context between calls. */
const loadSound = () => import("../../../../../src/components/chat-embed/lib/sound");

beforeEach(() => {
  vi.resetModules();
  contexts.length = 0;
  FakeAudioContext.resumeFails = false;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("primeAudio", () => {
  it("does nothing where the browser has no Web Audio", async () => {
    const { primeAudio, chime } = await loadSound();
    primeAudio();
    chime();
    expect(contexts).toHaveLength(0);
  });

  it("creates the audio context once", async () => {
    vi.stubGlobal("AudioContext", FakeAudioContext);
    const { primeAudio } = await loadSound();
    primeAudio();
    primeAudio();
    expect(contexts).toHaveLength(1);
  });
});

describe("chime", () => {
  it("stays silent until the audio is primed", async () => {
    vi.stubGlobal("AudioContext", FakeAudioContext);
    const { chime } = await loadSound();
    chime();
    expect(contexts).toHaveLength(0);
  });

  it("plays two rising notes once the context resumes", async () => {
    vi.stubGlobal("AudioContext", FakeAudioContext);
    const { primeAudio, chime } = await loadSound();
    primeAudio();
    chime();
    const [ctx] = contexts;
    await vi.waitFor(() => expect(ctx.oscillators).toHaveLength(2));

    expect(ctx.oscillators.map((osc) => osc.frequency.value)).toEqual([880, 1318.5]);
    expect(ctx.oscillators.every((osc) => osc.type === "sine")).toBe(true);
    expect(ctx.oscillators[0].start).toHaveBeenCalledWith(2);
    expect(ctx.oscillators[1].start.mock.calls[0][0]).toBeCloseTo(2.12);
    expect(ctx.oscillators[0].stop.mock.calls[0][0]).toBeCloseTo(2.3);
    expect(ctx.gains[0].connect).toHaveBeenCalledWith(ctx.destination);
    expect(ctx.gains[0].gain.setValueAtTime).toHaveBeenCalledWith(0.0001, 2);
  });

  it("warns instead of throwing when the browser will not play", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal("AudioContext", FakeAudioContext);
    FakeAudioContext.resumeFails = true;
    const { primeAudio, chime } = await loadSound();
    primeAudio();
    chime();
    await vi.waitFor(() =>
      expect(warn).toHaveBeenCalledWith("[chat] chime could not play", expect.any(Error))
    );
    expect(contexts[0].oscillators).toHaveLength(0);
  });
});
