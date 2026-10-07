import { describe, expect, it } from 'vitest';
import {
  AA_TEXT,
  contrastRatio,
  ensureContrast,
  luminance,
  parseColor,
} from '../../../src/a11y/contrast';

describe('parseColor', () => {
  it('reads six-digit hex, ignoring any alpha pair', () => {
    expect(parseColor('#1a2b3c')).toEqual([26, 43, 60]);
    expect(parseColor('#1a2b3cff')).toEqual([26, 43, 60]);
  });

  it('expands three-digit hex', () => {
    expect(parseColor('#fa0')).toEqual([255, 170, 0]);
  });

  it('trims surrounding space', () => {
    expect(parseColor('  #000000 ')).toEqual([0, 0, 0]);
  });

  it('reads rgb() and rgba(), with commas or spaces, ignoring alpha', () => {
    expect(parseColor('rgb(10, 20, 30)')).toEqual([10, 20, 30]);
    expect(parseColor('RGBA(255,128,0,0.5)')).toEqual([255, 128, 0]);
    expect(parseColor('rgb(1 2 3)')).toEqual([1, 2, 3]);
  });

  it('refuses something that is not a colour', () => {
    expect(() => parseColor('tomato')).toThrow('Cannot read a colour from "tomato"');
  });
});

describe('luminance', () => {
  it('is 0 for black and 1 for white, whichever notation', () => {
    expect(luminance('#000')).toBe(0);
    expect(luminance('rgb(255, 255, 255)')).toBeCloseTo(1, 10);
  });

  it('uses the linear segment for very dark channels', () => {
    // 10/255 sits below the 0.03928 knee, so it is divided by 12.92.
    expect(luminance('rgb(10, 10, 10)')).toBeCloseTo(10 / 255 / 12.92, 10);
  });
});

describe('ensureContrast', () => {
  it('normalises a passing colour to #rrggbb', () => {
    expect(ensureContrast('#000', '#ffffff')).toBe('#000000');
    expect(ensureContrast('rgb(0, 0, 0)', '#ffffff')).toBe('#000000');
  });

  it('falls back to the far end when no mix reaches the ratio', () => {
    // 22:1 is above the 21:1 ceiling, so nothing can reach it.
    expect(ensureContrast('#777777', '#ffffff', 22)).toBe('#000000');
    expect(ensureContrast('#777777', '#000000', 22)).toBe('#ffffff');
  });

  it('honours a lower ratio for large text', () => {
    const adjusted = ensureContrast('#ffcc80', '#ffffff', 3);
    expect(contrastRatio(adjusted, '#ffffff')).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(adjusted, '#ffffff')).toBeLessThan(AA_TEXT);
  });
});
