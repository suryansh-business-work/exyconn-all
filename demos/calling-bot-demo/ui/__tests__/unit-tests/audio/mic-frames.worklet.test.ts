import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface Processor {
  port: { postMessage: ReturnType<typeof vi.fn> };
  process: (inputs: Float32Array[][]) => boolean;
}

/** The audio thread's globals the worklet relies on. */
class FakeProcessor {
  readonly port = { postMessage: vi.fn() };
}

/** Loads the worklet as the audio thread would, at `rate`, and returns its processor. */
async function loadWorklet(rate: number): Promise<{ name: string; processor: Processor }> {
  let registered: { name: string; ctor: new () => Processor } | null = null;
  vi.stubGlobal('AudioWorkletProcessor', FakeProcessor);
  vi.stubGlobal('sampleRate', rate);
  vi.stubGlobal('registerProcessor', (name: string, ctor: new () => Processor) => {
    registered = { name, ctor };
  });
  vi.resetModules();
  await import('../../../src/audio/mic-frames.worklet.js');
  if (!registered) {
    throw new Error('The worklet registered no processor');
  }
  const { name, ctor } = registered as { name: string; ctor: new () => Processor };
  return { name, processor: new ctor() };
}

/** The 16-bit frames posted so far. */
const framesOf = (processor: Processor) =>
  processor.port.postMessage.mock.calls.map(([buffer]) => Array.from(new Int16Array(buffer)));

describe('the microphone worklet', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('registers itself as mic-frames and keeps running', async () => {
    const { name, processor } = await loadWorklet(16000);
    expect(name).toBe('mic-frames');
    expect(processor.process([[new Float32Array(10)]])).toBe(true);
  });

  it('posts 20 ms frames of 16-bit samples, transferring each buffer', async () => {
    const { processor } = await loadWorklet(16000);
    const input = new Float32Array(400).fill(0.5);
    processor.process([[input]]);
    expect(processor.port.postMessage).toHaveBeenCalledTimes(1);
    const [buffer, transfer] = processor.port.postMessage.mock.calls[0];
    expect(transfer).toEqual([buffer]);
    expect(framesOf(processor)[0]).toHaveLength(320);
    processor.process([[new Float32Array(240)]]);
    expect(framesOf(processor)).toHaveLength(2);
    expect(framesOf(processor)[1].slice(0, 80)).toEqual(new Array(80).fill(16383));
  });

  it('scales and clamps samples to the 16-bit range', async () => {
    const { processor } = await loadWorklet(16000);
    const input = new Float32Array(320);
    input.set([1, -1, 2, -2, 0.5, -0.5]);
    processor.process([[input]]);
    expect(framesOf(processor)[0].slice(0, 6)).toEqual([32767, -32768, 32767, -32768, 16383, -16384]);
  });

  it('keeps every third sample of a 48 kHz device, across chunk boundaries', async () => {
    const { processor } = await loadWorklet(48000);
    const ramp = (from: number, count: number) =>
      Float32Array.from({ length: count }, (_value, index) => (from + index) / 1000);
    processor.process([[ramp(0, 500)]]);
    processor.process([[ramp(500, 460)]]);
    const [frame] = framesOf(processor);
    expect(frame).toHaveLength(320);
    expect(frame.slice(0, 3)).toEqual([0, 98, 196]);
    expect(frame[167]).toBe(Math.trunc((501 / 1000) * 0x7fff));
  });

  it('waits quietly while the microphone gives no input', async () => {
    const { processor } = await loadWorklet(16000);
    expect(processor.process([])).toBe(true);
    expect(processor.process([[]])).toBe(true);
    expect(processor.port.postMessage).not.toHaveBeenCalled();
  });
});
