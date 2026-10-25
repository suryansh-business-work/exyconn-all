/** Opus at 32 kb/s: plenty for speech, about 60 KB per 15 s chunk. */
const SEGMENT_OPTIONS: MediaRecorderOptions = {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 32_000,
};
/** Shorter than this is a stop right after a start: nothing worth transcribing. */
const MIN_SEGMENT_MS = 500;

export interface RecordedSegment {
  /** Wall-clock time the segment began. */
  startedAt: number;
  durationMs: number;
  blob: Blob;
}

export interface SegmentRecorder {
  pause(): Promise<void>;
  resume(): void;
  stop(): Promise<void>;
}

/**
 * Records one audio stream as back-to-back, self-contained WebM files of about `chunkMs`:
 * each chunk is its own MediaRecorder, so every file the server gets has its own header and
 * can be transcribed on its own. Pausing closes the current chunk; resuming opens a new one.
 */
export function createSegmentRecorder(
  stream: MediaStream,
  chunkMs: number,
  onSegment: (segment: RecordedSegment) => void,
  onError: (error: unknown) => void,
): SegmentRecorder {
  let recorder: MediaRecorder | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function begin(): void {
    const parts: Blob[] = [];
    const startedAt = Date.now();
    const current = new MediaRecorder(stream, SEGMENT_OPTIONS);
    current.ondataavailable = (event) => parts.push(event.data);
    current.onstop = () => {
      const durationMs = Date.now() - startedAt;
      if (durationMs >= MIN_SEGMENT_MS) {
        onSegment({ startedAt, durationMs, blob: new Blob(parts, { type: current.mimeType }) });
      }
    };
    current.start();
    recorder = current;
    timer = setTimeout(() => {
      end().then(begin).catch(onError);
    }, chunkMs);
  }

  /** Closes the chunk in progress; resolves once its file has been handed over. */
  function end(): Promise<void> {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    const current = recorder;
    recorder = null;
    if (current === null || current.state === 'inactive') {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      current.addEventListener('stop', () => resolve(), { once: true });
      current.stop();
    });
  }

  begin();
  return {
    pause: end,
    resume: () => {
      if (recorder === null) {
        begin();
      }
    },
    stop: end,
  };
}
