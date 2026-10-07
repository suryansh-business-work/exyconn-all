import { afterEach, describe, expect, it, vi } from 'vitest';
import { ACCENT_KEYS } from '@exyconn/wa-flow';
import { useCompact, useReducedMotion, useWaPalette } from '../../../src/theme/useWa';
import { WA_DARK, WA_LIGHT, WA_MOTION } from '../../../src/theme/wa.tokens';
import { PHONE_WIDTH, REDUCED_MOTION, stubMatchMedia } from '../media';
import { renderHookWithProviders } from '../test-utils';

/** Where the shell's ColorModeProvider keeps the viewer's colour-mode choice. */
const COLOR_MODE_KEY = 'exyconn-track.color-mode';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('useWaPalette', () => {
  it('wears the light skin in light mode', () => {
    const { result } = renderHookWithProviders(() => useWaPalette());
    expect(result.current).toBe(WA_LIGHT);
  });

  it('wears the dark skin when the portal is in dark mode', () => {
    localStorage.setItem(COLOR_MODE_KEY, 'dark');
    const { result } = renderHookWithProviders(() => useWaPalette());
    expect(result.current).toBe(WA_DARK);
  });
});

describe('useCompact', () => {
  it('is the wide, two-pane layout when the screen is wide', () => {
    stubMatchMedia(() => false);
    const { result } = renderHookWithProviders(() => useCompact());
    expect(result.current).toBe(false);
  });

  it('is the phone layout below the md breakpoint', () => {
    stubMatchMedia(PHONE_WIDTH);
    const { result } = renderHookWithProviders(() => useCompact());
    expect(result.current).toBe(true);
  });
});

describe('useReducedMotion', () => {
  it('is off unless the viewer asked for less motion', () => {
    stubMatchMedia(PHONE_WIDTH);
    const { result } = renderHookWithProviders(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('follows prefers-reduced-motion', () => {
    stubMatchMedia(REDUCED_MOTION);
    const { result } = renderHookWithProviders(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});

describe('wa tokens', () => {
  it('gives every accent a colour in both skins', () => {
    for (const key of ACCENT_KEYS) {
      expect(WA_LIGHT.accents[key]).toMatch(/^#[\da-f]{6}$/);
      expect(WA_DARK.accents[key]).toMatch(/^#[\da-f]{6}$/);
    }
  });

  it('turns the ticks blue only after they were delivered', () => {
    expect(WA_MOTION.readMs).toBeGreaterThan(WA_MOTION.deliveredMs);
  });
});
