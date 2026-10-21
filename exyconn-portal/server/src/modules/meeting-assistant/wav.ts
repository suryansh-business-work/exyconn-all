/** The only audio the assistant accepts and keeps: 16 kHz, mono, 16-bit PCM WAV. */
export const WAV_SAMPLE_RATE = 16_000;
export const WAV_HEADER_BYTES = 44;
const BYTES_PER_SECOND = WAV_SAMPLE_RATE * 2;

export interface WavInfo {
  dataBytes: number;
  durationMs: number;
}

/**
 * Checks a WAV file is exactly the canonical 44-byte-header 16 kHz mono PCM16 the extension
 * writes, and returns its size and length. Null for anything else — another rate, stereo,
 * a compressed codec or a truncated file — so it never reaches storage or OpenAI.
 */
export function readWav16k(buffer: Buffer): WavInfo | null {
  if (buffer.length < WAV_HEADER_BYTES) {
    return null;
  }
  const valid =
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WAVE' &&
    buffer.toString('ascii', 12, 16) === 'fmt ' &&
    buffer.readUInt32LE(16) === 16 &&
    buffer.readUInt16LE(20) === 1 &&
    buffer.readUInt16LE(22) === 1 &&
    buffer.readUInt32LE(24) === WAV_SAMPLE_RATE &&
    buffer.readUInt16LE(34) === 16 &&
    buffer.toString('ascii', 36, 40) === 'data';
  const dataBytes = valid ? buffer.readUInt32LE(40) : -1;
  if (!valid || dataBytes !== buffer.length - WAV_HEADER_BYTES || dataBytes % 2 !== 0) {
    return null;
  }
  return { dataBytes, durationMs: Math.round((dataBytes / BYTES_PER_SECOND) * 1000) };
}

/** The 44-byte header of a 16 kHz mono PCM16 WAV holding `dataBytes` of samples. */
export function wavHeader(dataBytes: number): Buffer {
  const header = Buffer.alloc(WAV_HEADER_BYTES);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + dataBytes, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(WAV_SAMPLE_RATE, 24);
  header.writeUInt32LE(BYTES_PER_SECOND, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(dataBytes, 40);
  return header;
}
