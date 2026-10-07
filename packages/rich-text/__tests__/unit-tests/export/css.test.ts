import { describe, expect, it } from 'vitest';
import { firstFamily, pixels, toHex } from '../../../src/export/css';

describe('toHex', () => {
  it('leaves an unset or blank colour unset', () => {
    expect(toHex(undefined)).toBeUndefined();
    expect(toHex(null)).toBeUndefined();
    expect(toHex('   ')).toBeUndefined();
  });

  it('expands short hex and lower-cases long hex', () => {
    expect(toHex('#AbC')).toBe('#aabbcc');
    expect(toHex(' #155DFC ')).toBe('#155dfc');
  });

  it('rejects hex of any other length', () => {
    expect(toHex('#abcd')).toBeUndefined();
    expect(toHex('#')).toBeUndefined();
  });

  it('converts rgb() and rgba(), clamping and rounding each channel', () => {
    expect(toHex('rgb(21, 93, 252)')).toBe('#155dfc');
    expect(toHex('rgba(300, -5, 10.6, 0.5)')).toBe('#ff000b');
    expect(toHex('rgb(0, 0, 0)')).toBe('#000000');
  });

  it('rejects rgb() with too few or non-numeric channels', () => {
    expect(toHex('rgb(1, 2)')).toBeUndefined();
    expect(toHex('rgb(a, b, c)')).toBeUndefined();
  });

  it('leaves named colours and keywords unset', () => {
    expect(toHex('red')).toBeUndefined();
    expect(toHex('inherit')).toBeUndefined();
  });
});

describe('pixels', () => {
  it('reads a pixel length as a number', () => {
    expect(pixels('16px')).toBe(16);
    expect(pixels(' 12.5px ')).toBe(12.5);
  });

  it('ignores other units, garbage and missing values', () => {
    expect(pixels('1.2em')).toBeUndefined();
    expect(pixels('px')).toBeUndefined();
    expect(pixels(undefined)).toBeUndefined();
    expect(pixels(null)).toBeUndefined();
  });
});

describe('firstFamily', () => {
  it('returns the first face of a stack, unquoted', () => {
    expect(firstFamily('"Times New Roman", Times, serif')).toBe('Times New Roman');
    expect(firstFamily("'Courier New', monospace")).toBe('Courier New');
    expect(firstFamily('Arial')).toBe('Arial');
  });

  it('returns nothing when there is no first face', () => {
    expect(firstFamily(undefined)).toBeUndefined();
    expect(firstFamily(null)).toBeUndefined();
    expect(firstFamily(', serif')).toBeUndefined();
  });
});
