import { vi } from 'vitest';

/** A node in the fake audio graph. */
function node() {
  return { connect: vi.fn(), disconnect: vi.fn() };
}

export const contexts: FakeAudioContext[] = [];
export const worklets: FakeWorkletNode[] = [];

export class FakeAudioContext {
  readonly sampleRate: number;
  readonly destination = { kind: 'speakers' };
  readonly audioWorklet = { addModule: vi.fn(() => Promise.resolve()) };
  readonly sources: Array<ReturnType<typeof node> & { stream: unknown }> = [];
  readonly gains: Array<ReturnType<typeof node> & { gain: { value: number } }> = [];
  readonly close = vi.fn(() => Promise.resolve());

  constructor(options?: { sampleRate?: number }) {
    this.sampleRate = options?.sampleRate ?? 48_000;
    contexts.push(this);
  }

  createMediaStreamSource(stream: unknown) {
    const source = { ...node(), stream };
    this.sources.push(source);
    return source;
  }

  createGain() {
    const gain = { ...node(), gain: { value: 1 } };
    this.gains.push(gain);
    return gain;
  }
}

export class FakeWorkletNode {
  readonly port: { onmessage: ((event: { data: Float32Array }) => void) | null } = {
    onmessage: null,
  };
  readonly connect = vi.fn();
  readonly disconnect = vi.fn();

  constructor(
    readonly context: FakeAudioContext,
    readonly name: string,
  ) {
    worklets.push(this);
  }

  /** What the worklet would post from the audio thread. */
  emit(samples: number): void {
    this.port.onmessage?.({ data: new Float32Array(samples).fill(0.5) });
  }
}

/** A captured stream with one track that can end. */
export function fakeStream() {
  const ended = new Set<() => void>();
  const track = {
    stop: vi.fn(),
    addEventListener: (_: string, listener: () => void) => ended.add(listener),
  };
  return {
    track,
    end: () => ended.forEach((listener) => listener()),
    getTracks: () => [track],
    getAudioTracks: () => [track],
  };
}

export function installAudio(): void {
  contexts.length = 0;
  worklets.length = 0;
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal('AudioWorkletNode', FakeWorkletNode);
}
