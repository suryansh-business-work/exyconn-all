import { spawn } from 'node:child_process';
import type { Writable } from 'node:stream';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

/** The video codec a screen recording part was captured in. */
export type ScreenCodec = 'h264' | 'vp8';

/** The codec a piece's Content-Type names: `video/webm;codecs=h264,opus` is H.264, else VP8. */
export const codecOfMime = (mime: string): ScreenCodec =>
  /\b(?:h264|avc1)\b/i.test(mime) ? 'h264' : 'vp8';

/**
 * H.264 is copied as it is (a remux, no re-encode); VP8, from recordings made before the
 * extension switched codec, is encoded once into H.264. Audio becomes AAC, which every player
 * and phone opens. The output is a fragmented MP4 so it can stream while it is written.
 */
const ffmpegArgs = (codec: ScreenCodec) => [
  '-hide_banner',
  '-loglevel',
  'error',
  '-fflags',
  '+genpts',
  '-i',
  'pipe:0',
  ...(codec === 'h264'
    ? ['-c:v', 'copy']
    : ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26']),
  '-c:a',
  'aac',
  '-b:a',
  '96k',
  '-movflags',
  'frag_keyframe+empty_moov+default_base_moof',
  '-f',
  'mp4',
  'pipe:1',
];

/**
 * Streams a WebM recording out as MP4: `feed` writes the WebM into ffmpeg, ffmpeg's output goes
 * to `out`. Rejects when ffmpeg fails, with its error output in the log.
 */
export function streamAsMp4(
  codec: ScreenCodec,
  feed: (input: Writable) => Promise<unknown>,
  out: Writable,
): Promise<void> {
  const ffmpeg = spawn(env.meetAssistant.ffmpegPath, ffmpegArgs(codec), {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let stderr = '';
  ffmpeg.stderr.on('data', (data: Buffer) => {
    stderr = (stderr + data.toString()).slice(-2000);
  });
  // Ended only on success: a failed conversion breaks the download instead of truncating it.
  ffmpeg.stdout.pipe(out, { end: false });
  // ffmpeg may stop reading early (bad input); its own exit code reports that.
  ffmpeg.stdin.on('error', (error) => logger.warn({ err: error }, 'ffmpeg input closed'));
  const exited = new Promise<void>((resolve, reject) => {
    ffmpeg.once('error', reject);
    ffmpeg.once('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      logger.error({ code, stderr }, 'ffmpeg could not convert the recording to MP4');
      reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
  const fed = feed(ffmpeg.stdin).catch((error: unknown) => {
    ffmpeg.kill('SIGKILL');
    throw error;
  });
  return Promise.all([fed, exited]).then(
    () => {
      out.end();
    },
    (error: unknown) => {
      out.destroy();
      throw error;
    },
  );
}
