import { describe, expect, it } from 'vitest';
import { groundOpacity, supportsTransparency } from './transparency';

describe('supportsTransparency', () => {
  it('is on for macOS and for Windows 11 22H2 onwards', () => {
    expect(supportsTransparency('darwin', '15.2.0')).toBe(true);
    expect(supportsTransparency('win32', '10.0.22621')).toBe(true);
    expect(supportsTransparency('win32', '10.0.26100')).toBe(true);
  });

  it('is off for older Windows, which has no acrylic, and for Linux', () => {
    expect(supportsTransparency('win32', '10.0.19045')).toBe(false);
    expect(supportsTransparency('win32', '')).toBe(false);
    expect(supportsTransparency('linux', '6.8.0')).toBe(false);
  });
});

describe('groundOpacity', () => {
  const on = { transparentBackground: true, backgroundOpacity: 0.6 };

  it('thins the ground only where the OS can show through it', () => {
    expect(groundOpacity(true, on)).toBe(0.6);
    expect(groundOpacity(false, on)).toBe(1);
    expect(groundOpacity(true, { ...on, transparentBackground: false })).toBe(1);
  });
});
