/** H.264 at ~1 Mb/s for 720p/15 fps (the server remuxes it to MP4 without re-encoding), Opus audio. */
const VIDEO_OPTIONS: MediaRecorderOptions = {
  mimeType: 'video/webm;codecs=h264,opus',
  videoBitsPerSecond: 1_000_000,
  audioBitsPerSecond: 64_000,
};

export interface RecordedPiece {
  seq: number;
  durationMs: number;
  blob: Blob;
}

export interface VideoRecorder {
  pause(): void;
  resume(): void;
  stop(): Promise<void>;
}

/**
 * Records the shared tab (video plus the mixed call audio) as ONE continuous WebM, handed
 * over every `pieceMs` while the call runs: piece 0 carries the header, the others continue
 * it, so the pieces joined in order are the whole recording.
 */
export function createVideoRecorder(
  stream: MediaStream,
  pieceMs: number,
  onPiece: (piece: RecordedPiece) => void,
): VideoRecorder {
  const recorder = new MediaRecorder(stream, VIDEO_OPTIONS);
  let seq = 0;
  let since = Date.now();
  recorder.ondataavailable = (event) => {
    const now = Date.now();
    if (event.data.size > 0) {
      onPiece({ seq, durationMs: Math.max(1, now - since), blob: event.data });
      seq += 1;
    }
    since = now;
  };
  recorder.start(pieceMs);

  return {
    pause: () => {
      if (recorder.state === 'recording') {
        recorder.requestData();
        recorder.pause();
      }
    },
    resume: () => {
      if (recorder.state === 'paused') {
        since = Date.now();
        recorder.resume();
      }
    },
    stop: () => {
      if (recorder.state === 'inactive') {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        recorder.addEventListener('stop', () => resolve(), { once: true });
        recorder.stop();
      });
    },
  };
}
