import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from './config';
import { SCREEN, type Stage } from './display';
import { log } from './log';

/** A screen piece goes up every ~5 s, like the extension's; joined in order they are one file. */
const PIECE_MS = 5000;
/** A transcription chunk is ~15 s of call audio, a self-contained WebM/Opus file. */
const AUDIO_SECONDS = 15;
const LIST_POLL_MS = 2000;

export interface RecorderHandlers {
  /** Some of the continuous H.264/Opus Matroska stream (only when recordings are saved). */
  onPiece(bytes: Buffer, durationMs: number): void;
  /** One finished audio chunk: its file and where it sits in the call. */
  onAudio(file: string, startMs: number, durationMs: number): void;
}

export interface Recorder {
  stop(): Promise<void>;
}

const VIDEO_OUTPUT = [
  '-map',
  '0:v',
  '-map',
  '1:a',
  '-c:v',
  'libx264',
  '-preset',
  'veryfast',
  '-tune',
  'zerolatency',
  '-pix_fmt',
  'yuv420p',
  '-g',
  '30',
  '-b:v',
  '1000k',
  '-c:a',
  'libopus',
  '-b:a',
  '64k',
  '-f',
  'matroska',
  '-live',
  '1',
  'pipe:1',
];

const audioOutput = (dir: string) => [
  '-map',
  '1:a',
  '-c:a',
  'libopus',
  '-b:a',
  '32k',
  '-ac',
  '1',
  '-ar',
  '16000',
  '-f',
  'segment',
  '-segment_time',
  String(AUDIO_SECONDS),
  '-segment_format',
  'webm',
  '-reset_timestamps',
  '1',
  '-segment_list',
  path.join(dir, 'audio.csv'),
  '-segment_list_type',
  'csv',
  path.join(dir, 'audio_%05d.webm'),
];

/**
 * Records the trip's display and sink with ffmpeg: the screen as H.264 + Opus (streamed out in
 * pieces), and the call audio as 15 s chunks for transcription, listed in a CSV as each closes.
 */
export function startRecorder(
  stage: Stage,
  dir: string,
  saveVideo: boolean,
  handlers: RecorderHandlers,
): Recorder {
  const ffmpeg = spawn(
    config.ffmpegPath,
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-f',
      'x11grab',
      '-video_size',
      `${SCREEN.width}x${SCREEN.height}`,
      '-framerate',
      '15',
      '-draw_mouse',
      '0',
      '-i',
      `${stage.display}.0`,
      '-f',
      'pulse',
      '-i',
      `${stage.sink}.monitor`,
      ...(saveVideo ? VIDEO_OUTPUT : []),
      ...audioOutput(dir),
    ],
    { stdio: ['pipe', 'pipe', 'pipe'] },
  );
  let buffered: Buffer[] = [];
  let since = Date.now();
  const flush = () => {
    if (buffered.length > 0) {
      handlers.onPiece(Buffer.concat(buffered), Math.max(1, Date.now() - since));
      buffered = [];
    }
    since = Date.now();
  };
  ffmpeg.stdout.on('data', (chunk: Buffer) => buffered.push(chunk));
  ffmpeg.stderr.on('data', (data: Buffer) =>
    log('warn', 'ffmpeg', { out: data.toString().slice(0, 500) }),
  );
  let listed = 0;
  const readList = async () => {
    const rows = (await readFile(path.join(dir, 'audio.csv'), 'utf8').catch(() => ''))
      .split('\n')
      .filter(Boolean);
    for (const row of rows.slice(listed)) {
      const [file, start, end] = row.split(',');
      const startMs = Math.round(Number.parseFloat(start) * 1000);
      handlers.onAudio(
        path.join(dir, file),
        startMs,
        Math.round(Number.parseFloat(end) * 1000) - startMs,
      );
    }
    listed = rows.length;
  };
  const pieces = saveVideo ? globalThis.setInterval(flush, PIECE_MS) : null;
  const lists = globalThis.setInterval(() => {
    readList().catch((error: unknown) =>
      log('warn', 'Audio list unreadable', { error: String(error) }),
    );
  }, LIST_POLL_MS);
  const exited = new Promise<void>((resolve) => ffmpeg.once('close', () => resolve()));
  let stopped = false;
  return {
    async stop() {
      if (stopped) {
        return;
      }
      stopped = true;
      // `q` ends ffmpeg cleanly: it closes the last segment and the Matroska stream.
      ffmpeg.stdin.end('q');
      await Promise.race([
        exited,
        new Promise((resolve) => globalThis.setTimeout(resolve, 15_000)),
      ]);
      ffmpeg.kill('SIGKILL');
      if (pieces) {
        globalThis.clearInterval(pieces);
      }
      globalThis.clearInterval(lists);
      flush();
      await readList();
    },
  };
}
