import { vi } from 'vitest';

/** One microphone stream, whose tracks the recorder must release. */
export function fakeStream() {
  const track = { stop: vi.fn() };
  return { track, stream: { getTracks: () => [track] } };
}

/** The browser's MediaRecorder: records nothing, but runs the same events in the same order. */
export class FakeMediaRecorder {
  static readonly instances: FakeMediaRecorder[] = [];
  state: 'inactive' | 'recording' = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  readonly stop = vi.fn(() => {
    this.state = 'inactive';
    this.onstop?.();
  });

  constructor(readonly stream: unknown) {
    FakeMediaRecorder.instances.push(this);
  }

  start() {
    this.state = 'recording';
  }

  /** What the browser hands over as the recording grows. */
  record(...chunks: Blob[]) {
    for (const data of chunks) {
      this.ondataavailable?.({ data });
    }
  }
}

/** Installs (or with `getUserMedia` undefined, removes) the microphone API. */
export function installMicrophone(getUserMedia: (() => Promise<unknown>) | undefined) {
  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    configurable: true,
    value: getUserMedia ? { getUserMedia } : undefined,
  });
}
