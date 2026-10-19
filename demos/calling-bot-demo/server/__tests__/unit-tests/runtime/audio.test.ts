import { describe, expect, it } from 'vitest';
import { BROWSER_AUDIO, bytesPerSecond, PHONE_AUDIO, playMs } from '../../../src/runtime/audio';

describe('call audio', () => {
  it('knows how many bytes a second of each format takes', () => {
    expect(bytesPerSecond(BROWSER_AUDIO)).toBe(32_000);
    expect(bytesPerSecond(PHONE_AUDIO)).toBe(8_000);
  });

  it('times a base64 chunk by its decoded size', () => {
    const tenthOfASecond = Buffer.alloc(800).toString('base64');
    expect(playMs(tenthOfASecond, PHONE_AUDIO)).toBe(100);
    expect(playMs(tenthOfASecond, BROWSER_AUDIO)).toBe(25);
    expect(playMs('', PHONE_AUDIO)).toBe(0);
  });
});
