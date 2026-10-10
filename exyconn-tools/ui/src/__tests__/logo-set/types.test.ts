import { describe, expect, it } from 'vitest';
import {
  ALL_SIZES,
  CANVAS_SIZES,
  FAVICON_SIZES,
  ICON_SIZES,
  LOGO_SIZES,
  SCOPE_OPTIONS,
  SPLASH_SIZES,
  calculateContrastRatio,
  calculateLuminance,
  getContrastRating,
  hexToRgb,
} from '../../tools/logo-set/types';

describe('logo-set colour helpers', () => {
  it('parses hex colours with or without the hash and rejects everything else', () => {
    expect(hexToRgb('#ff8000')).toEqual({ r: 255, g: 128, b: 0 });
    expect(hexToRgb('00ff10')).toEqual({ r: 0, g: 255, b: 16 });
    expect(hexToRgb('#fff')).toBeNull();
    expect(hexToRgb('nope')).toBeNull();
  });

  it('computes relative luminance for black, white and an invalid colour', () => {
    expect(calculateLuminance('#000000')).toBe(0);
    expect(calculateLuminance('#ffffff')).toBeCloseTo(1, 5);
    expect(calculateLuminance('bad')).toBe(0);
    // Dark channel values use the linear branch of the sRGB curve.
    expect(calculateLuminance('#030303')).toBeCloseTo((3 / 255 / 12.92) * 1, 5);
  });

  it('gives 21:1 for black on white regardless of argument order', () => {
    expect(calculateContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(calculateContrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(calculateContrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  it('rates contrast at the WCAG thresholds', () => {
    expect(getContrastRating(7)).toMatchObject({
      rating: 'Excellent (AAA)',
      passes: { aa: true, aaLarge: true, aaa: true, aaaLarge: true },
    });
    expect(getContrastRating(4.5)).toMatchObject({
      rating: 'Good (AA)',
      passes: { aa: true, aaa: false, aaaLarge: true },
    });
    expect(getContrastRating(3)).toMatchObject({
      rating: 'Large Text Only',
      passes: { aa: false, aaLarge: true, aaaLarge: false },
    });
    expect(getContrastRating(2.9)).toMatchObject({
      rating: 'Poor Contrast',
      passes: { aa: false, aaLarge: false, aaa: false, aaaLarge: false },
    });
  });
});

describe('logo-set size catalogue', () => {
  it('lists every size once, and every scope option points at a real size or group', () => {
    expect(ALL_SIZES).toHaveLength(FAVICON_SIZES.length + ICON_SIZES.length + LOGO_SIZES.length + SPLASH_SIZES.length);
    expect(CANVAS_SIZES).toBe(ALL_SIZES);
    const keys = new Set(
      ALL_SIZES.map((size) => `${size.category}-${size.width}${size.category === 'splash' ? `x${size.height}` : ''}`)
    );
    SCOPE_OPTIONS.filter((option) => !option.value.endsWith('-all') && option.value !== 'all').forEach((option) => {
      expect(keys.has(option.value)).toBe(true);
    });
  });
});
