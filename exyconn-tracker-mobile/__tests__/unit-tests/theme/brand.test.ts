import { describe, expect, it } from 'vitest';
import type { Branding } from '@exyconn/tracker-core';
import { brandColors, luminance, resolveScheme, toHex } from '../../../src/theme/brand';
import { FALLBACK_BRAND } from '../../../src/theme/palette';

describe('toHex', () => {
  it('expands a three-digit colour and adds the hash', () => {
    expect(toHex('#abc', '#000000')).toBe('#aabbcc');
    expect(toHex('fa0', '#000000')).toBe('#ffaa00');
  });

  it('keeps a six-digit colour, trimming stray spaces', () => {
    expect(toHex('  #1A2b3C ', '#000000')).toBe('#1A2b3C');
    expect(toHex('123456', '#000000')).toBe('#123456');
  });

  it('falls back for anything that is not a hex colour', () => {
    expect(toHex(undefined, '#010203')).toBe('#010203');
    expect(toHex('', '#010203')).toBe('#010203');
    expect(toHex('red', '#010203')).toBe('#010203');
    expect(toHex('#12345', '#010203')).toBe('#010203');
  });
});

describe('luminance', () => {
  it('reads white as fully light and black as fully dark', () => {
    expect(luminance('#ffffff')).toBe(1);
    expect(luminance('#000000')).toBe(0);
  });

  it('weighs green above red above blue, as the eye does', () => {
    expect(luminance('#00ff00')).toBeGreaterThan(luminance('#ff0000'));
    expect(luminance('#ff0000')).toBeGreaterThan(luminance('#0000ff'));
  });
});

describe('resolveScheme', () => {
  it('lets an explicit choice overrule the brand and the OS', () => {
    expect(resolveScheme('light', '#000000', true)).toBe('light');
    expect(resolveScheme('dark', '#ffffff', false)).toBe('dark');
  });

  it('follows the OS, then the brand’s own background, on system', () => {
    expect(resolveScheme('system', '#ffffff', true)).toBe('dark');
    expect(resolveScheme('system', '#0b1026', false)).toBe('dark');
    expect(resolveScheme('system', '#f5f5f5', false)).toBe('light');
  });
});

describe('brandColors', () => {
  it('uses Exyconn’s own brand until the portal’s arrives', () => {
    const colors = brandColors(null, 'light');
    expect(colors.secondary).toBe(FALLBACK_BRAND.secondary);
    expect(colors.background).toBe(FALLBACK_BRAND.background);
    expect(colors.primary).toMatch(/^#[\da-f]{6}$/i);
  });

  it('normalises the workspace’s colours', () => {
    const branding = {
      primaryColor: '#123',
      secondaryColor: 'abc',
      backgroundColor: '#fefefe',
    } as Branding;
    const colors = brandColors(branding, 'light');
    expect(colors.secondary).toBe('#aabbcc');
    expect(colors.background).toBe('#fefefe');
    expect(colors.primary).toBe('#112233');
  });
});
