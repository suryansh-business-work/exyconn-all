import { afterEach, describe, expect, it, vi } from 'vitest';
import { Chart as ChartJs } from 'chart.js';

/** chart.js itself is not reloaded by resetModules, so its defaults are put back by hand. */
const originalAnimation = ChartJs.defaults.animation;

function stubReducedMotion(matches: boolean) {
  const matchMedia = vi.fn((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  vi.stubGlobal('matchMedia', matchMedia);
  return matchMedia;
}

async function loadSetup() {
  vi.resetModules();
  return import('../../../src/charts/chart-setup');
}

afterEach(() => {
  ChartJs.defaults.animation = originalAnimation;
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('chart-setup', () => {
  it('registers every controller and scale the charts draw with', async () => {
    const { Chart } = await loadSetup();
    for (const id of ['bar', 'line']) {
      expect(Chart.registry.getController(id)).toBeDefined();
    }
    for (const id of ['category', 'linear']) {
      expect(Chart.registry.getScale(id)).toBeDefined();
    }
    expect(Chart.registry.getPlugin('tooltip')).toBeDefined();
    expect(Chart.registry.getPlugin('legend')).toBeDefined();
    expect(Chart.registry.getPlugin('filler')).toBeDefined();
  });

  it('turns animation off for somebody who asked for reduced motion', async () => {
    const matchMedia = stubReducedMotion(true);
    const { Chart } = await loadSetup();
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(Chart.defaults.animation).toBe(false);
  });

  it('leaves animation on otherwise', async () => {
    stubReducedMotion(false);
    const { Chart } = await loadSetup();
    expect(Chart.defaults.animation).not.toBe(false);
  });

  it('does not fail where matchMedia does not exist', async () => {
    vi.stubGlobal('matchMedia', undefined);
    const { Chart } = await loadSetup();
    expect(Chart.defaults.animation).not.toBe(false);
  });
});
