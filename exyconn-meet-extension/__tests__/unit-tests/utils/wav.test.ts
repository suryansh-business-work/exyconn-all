import { describe, expect, it } from 'vitest';
import { base64DecodedLength, base64ToBytes } from '../../../src/utils/base64';
import {
  WAV_HEADER_BYTES,
  encodeWav,
  floatToInt16,
  framesToWavBase64,
  samplesToMs,
} from '../../../src/utils/wav';

const ascii = (bytes: Uint8Array, start: number, length: number): string =>
  String.fromCodePoint(...bytes.subarray(start, start + length));

describe('floatToInt16', () => {
  it('scales the full range and clips anything outside it', () => {
    const pcm = floatToInt16([Float32Array.from([0, 1, -1, 0.5, 2, -3])]);
    expect([...pcm]).toEqual([0, 32767, -32768, 16384, 32767, -32768]);
  });

  it('joins frames of different (odd) lengths in order', () => {
    const pcm = floatToInt16([Float32Array.from([0.25]), Float32Array.from([-0.25, 0, 1])]);
    expect([...pcm]).toEqual([8192, -8192, 0, 32767]);
  });

  it('returns nothing for no frames', () => {
    expect(floatToInt16([])).toHaveLength(0);
  });
});

describe('encodeWav', () => {
  it('writes a 16 kHz mono PCM16 RIFF header', () => {
    const wav = encodeWav(Int16Array.from([1, -1, 300]));
    const view = new DataView(wav.buffer);
    expect(wav).toHaveLength(WAV_HEADER_BYTES + 6);
    expect(ascii(wav, 0, 4)).toBe('RIFF');
    expect(view.getUint32(4, true)).toBe(36 + 6);
    expect(ascii(wav, 8, 8)).toBe('WAVEfmt ');
    expect(view.getUint32(16, true)).toBe(16);
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(16_000);
    expect(view.getUint32(28, true)).toBe(32_000);
    expect(view.getUint16(32, true)).toBe(2);
    expect(view.getUint16(34, true)).toBe(16);
    expect(ascii(wav, 36, 4)).toBe('data');
    expect(view.getUint32(40, true)).toBe(6);
    expect([0, 1, 2].map((i) => view.getInt16(44 + i * 2, true))).toEqual([1, -1, 300]);
  });

  it('writes a valid header around empty audio', () => {
    const wav = encodeWav(new Int16Array(0));
    expect(wav).toHaveLength(WAV_HEADER_BYTES);
    expect(new DataView(wav.buffer).getUint32(40, true)).toBe(0);
  });
});

describe('framesToWavBase64', () => {
  it('produces base64 that decodes to the WAV file', () => {
    const base64 = framesToWavBase64([Float32Array.from([0, 1, -1])]);
    const bytes = base64ToBytes(base64);
    expect(ascii(bytes, 0, 4)).toBe('RIFF');
    expect(bytes).toHaveLength(WAV_HEADER_BYTES + 6);
    expect(base64DecodedLength(base64)).toBe(bytes.length);
  });
});

describe('base64DecodedLength', () => {
  it('accounts for padding', () => {
    expect(base64DecodedLength('QQ==')).toBe(1);
    expect(base64DecodedLength('QUI=')).toBe(2);
    expect(base64DecodedLength('QUJD')).toBe(3);
  });
});

describe('samplesToMs', () => {
  it('converts samples at 16 kHz', () => {
    expect(samplesToMs(16_000 * 25)).toBe(25_000);
    expect(samplesToMs(8)).toBe(1);
  });
});
