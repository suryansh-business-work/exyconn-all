import { bytesToBase64 } from './base64';

/** The format the server accepts: 16 kHz, mono, 16-bit little-endian PCM in a WAV file. */
export const WAV_SAMPLE_RATE = 16_000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const BYTES_PER_SAMPLE = BITS_PER_SAMPLE / 8;
export const WAV_HEADER_BYTES = 44;

/** Float samples in [-1, 1] (clipped outside it) to signed 16-bit integers. */
export function floatToInt16(frames: readonly Float32Array[]): Int16Array {
  const total = frames.reduce((sum, frame) => sum + frame.length, 0);
  const pcm = new Int16Array(total);
  let offset = 0;
  for (const frame of frames) {
    for (const sample of frame) {
      const clipped = Math.max(-1, Math.min(1, sample));
      pcm[offset] = clipped < 0 ? Math.round(clipped * 0x8000) : Math.round(clipped * 0x7fff);
      offset += 1;
    }
  }
  return pcm;
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, Number(text.codePointAt(index)));
  }
}

/** PCM samples wrapped in a canonical 44-byte RIFF/WAVE header (format 1, mono, 16 kHz). */
export function encodeWav(pcm: Int16Array, sampleRate = WAV_SAMPLE_RATE): Uint8Array {
  const dataBytes = pcm.length * BYTES_PER_SAMPLE;
  const buffer = new ArrayBuffer(WAV_HEADER_BYTES + dataBytes);
  const view = new DataView(buffer);
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, CHANNELS, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * CHANNELS * BYTES_PER_SAMPLE, true); // byte rate
  view.setUint16(32, CHANNELS * BYTES_PER_SAMPLE, true); // block align
  view.setUint16(34, BITS_PER_SAMPLE, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataBytes, true);
  pcm.forEach((sample, index) =>
    view.setInt16(WAV_HEADER_BYTES + index * BYTES_PER_SAMPLE, sample, true),
  );
  return new Uint8Array(buffer);
}

/** Captured float frames → a base64 WAV file, ready for the JSON upload. */
export function framesToWavBase64(frames: readonly Float32Array[]): string {
  return bytesToBase64(encodeWav(floatToInt16(frames)));
}

/** How long `sampleCount` samples last at 16 kHz, in milliseconds. */
export function samplesToMs(sampleCount: number): number {
  return Math.round((sampleCount * 1000) / WAV_SAMPLE_RATE);
}
