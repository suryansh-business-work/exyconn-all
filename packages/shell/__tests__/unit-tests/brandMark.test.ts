import { describe, expect, it } from 'vitest';
import { pickBrandImage } from '@/hooks/useBrandMark';

const FALLBACK = '/exyconn-icon.svg';

describe('pickBrandImage', () => {
  it('uses the light image in light mode, even when a dark one is set', () => {
    expect(pickBrandImage(false, '/light.png', '/dark.png', FALLBACK)).toBe('/light.png');
  });

  it('uses the dark image in dark mode', () => {
    expect(pickBrandImage(true, '/light.png', '/dark.png', FALLBACK)).toBe('/dark.png');
  });

  it('falls back to the light image in dark mode when no dark one is set', () => {
    expect(pickBrandImage(true, '/light.png', '', FALLBACK)).toBe('/light.png');
  });

  it('falls back to the built-in mark when branding has no image', () => {
    expect(pickBrandImage(true, '', '', FALLBACK)).toBe(FALLBACK);
    expect(pickBrandImage(false, undefined, undefined, FALLBACK)).toBe(FALLBACK);
  });
});
