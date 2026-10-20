import type { AudioStream } from '../types/meeting';
import { WAV_SAMPLE_RATE, framesToWavBase64, samplesToMs } from '../utils/wav';

/** Registered by pcm-worklet.ts. */
const PCM_PROCESSOR = 'exyconn-pcm-capture';
const WORKLET_FILE = 'pcm-worklet.js';

export interface RecordedChunk {
  stream: AudioStream;
  /** Wall-clock time of the chunk's first sample. */
  startedAt: number;
  durationMs: number;
  /** base64 WAV, 16 kHz mono PCM16. */
  audio: string;
}

export interface ChunkRecorder {
  pause(): Promise<void>;
  resume(): void;
  stop(): Promise<void>;
}

/**
 * Records one stream as ~`chunkMs` WAV files. A dedicated 16 kHz AudioContext resamples the
 * stream and an AudioWorklet passes the samples here. Its output goes to a muted gain node:
 * this context is never the user's playback path (the offscreen page plays the tab audio
 * through its own default-rate context).
 */
export async function createChunkRecorder(
  source: MediaStream,
  stream: AudioStream,
  chunkMs: number,
  onChunk: (chunk: RecordedChunk) => Promise<void>,
  onError: (error: unknown) => void,
): Promise<ChunkRecorder> {
  const context = new AudioContext({ sampleRate: WAV_SAMPLE_RATE });
  await context.audioWorklet.addModule(chrome.runtime.getURL(WORKLET_FILE));
  const input = context.createMediaStreamSource(source);
  const worklet = new AudioWorkletNode(context, PCM_PROCESSOR);
  const mute = context.createGain();
  mute.gain.value = 0;
  input.connect(worklet);
  worklet.connect(mute);
  mute.connect(context.destination);

  const samplesPerChunk = (WAV_SAMPLE_RATE * chunkMs) / 1000;
  let frames: Float32Array[] = [];
  let samples = 0;
  let startedAt = Date.now();
  let recording = true;
  let pending: Promise<void> = Promise.resolve();

  const flush = (): Promise<void> => {
    if (samples === 0) {
      return pending;
    }
    const chunk: RecordedChunk = {
      stream,
      startedAt,
      durationMs: samplesToMs(samples),
      audio: framesToWavBase64(frames),
    };
    frames = [];
    samples = 0;
    // Chunks go out in order; a failed hand-over is reported and does not block the next one.
    pending = pending.then(() => onChunk(chunk)).catch(onError);
    return pending;
  };

  worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
    if (!recording) {
      return;
    }
    if (samples === 0) {
      startedAt = Date.now() - samplesToMs(event.data.length);
    }
    frames.push(event.data);
    samples += event.data.length;
    if (samples >= samplesPerChunk) {
      flush().catch(onError);
    }
  };

  return {
    pause: async () => {
      recording = false;
      await flush();
    },
    resume: () => {
      recording = true;
    },
    stop: async () => {
      recording = false;
      await flush();
      worklet.port.onmessage = null;
      input.disconnect();
      worklet.disconnect();
      await context.close();
    },
  };
}
