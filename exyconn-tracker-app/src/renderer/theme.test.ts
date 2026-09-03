import { describe, it, expect } from 'vitest';
import { buildTheme } from './theme';

/** A workspace whose brand background is light, so `system` would resolve to a light palette. */
const LIGHT_BRAND = {
  primaryColor: '#6C5CE7',
  secondaryColor: '#00D2C6',
  backgroundColor: '#FFFFFF',
  textColor: '#111111',
} as never;

describe('buildTheme light/dark', () => {
  it('follows the OS when the mode is system', () => {
    expect(buildTheme(null, 'system', true).palette.mode).toBe('dark');
    expect(buildTheme(LIGHT_BRAND, 'system', false).palette.mode).toBe('light');
  });

  it('lets an explicit choice overrule both the OS and the brand', () => {
    // The employee's screen is theirs; a light brand must not force a light app on them.
    expect(buildTheme(LIGHT_BRAND, 'dark', false).palette.mode).toBe('dark');
    expect(buildTheme(null, 'light', true).palette.mode).toBe('light');
  });

  it('defaults to the workspace brand when nothing is asked for', () => {
    // The Exyconn fallback background is dark, so this is the behaviour that already existed.
    expect(buildTheme(null).palette.mode).toBe('dark');
  });
});
