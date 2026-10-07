import { describe, expect, it } from 'vitest';
import type { TooltipItem } from 'chart.js';
import { axisChrome, sharedPlugins } from '../../../src/charts/chart-options';
import { chartPalette } from '../../../src/charts/palette';

const palette = chartPalette('light', '#ffffff', '#e4e4e7', '#67676f', '#09090b');
const pct = (value: number) => `${value}%`;

type LabelFn = (item: TooltipItem<'bar' | 'line'>) => string;

function tooltipLabel(): LabelFn {
  return sharedPlugins(palette, 1, pct)?.tooltip?.callbacks?.label as LabelFn;
}

function item(parsed: { x?: number | null; y?: number | null }, label?: string) {
  return { parsed, dataset: { label } } as unknown as TooltipItem<'bar' | 'line'>;
}

describe('sharedPlugins', () => {
  it('shows a legend only for two or more series, in the ink colour', () => {
    expect(sharedPlugins(palette, 1, pct)?.legend?.display).toBe(false);
    expect(sharedPlugins(palette, 0, pct)?.legend?.display).toBe(false);
    const legend = sharedPlugins(palette, 2, pct)?.legend;
    expect(legend).toMatchObject({
      display: true,
      position: 'bottom',
      labels: { color: palette.ink },
    });
  });

  it('paints the tooltip in the palette chrome', () => {
    expect(sharedPlugins(palette, 1, pct)?.tooltip).toMatchObject({
      backgroundColor: palette.surface,
      titleColor: palette.inkStrong,
      bodyColor: palette.ink,
      borderColor: palette.grid,
    });
  });

  it('labels a column by its y value', () => {
    expect(tooltipLabel()(item({ x: 1, y: 40 }, 'Done'))).toBe('Done: 40%');
  });

  it('labels a horizontal bar by its x value', () => {
    expect(tooltipLabel()(item({ x: 12, y: null }, 'Done'))).toBe('Done: 12%');
  });

  it('falls back to zero and an empty name when nothing is known', () => {
    expect(tooltipLabel()(item({ x: null, y: null }))).toBe(': 0%');
  });
});

describe('axisChrome tick labels', () => {
  it('passes the raw tick through when there is no formatter', () => {
    const { callback } = axisChrome(palette).value.ticks;
    expect(callback(3)).toBe(3);
    expect(callback('Mon')).toBe('Mon');
  });

  it('reads a string tick as a number before formatting it', () => {
    const { callback } = axisChrome(palette, pct).value.ticks;
    expect(callback('25')).toBe('25%');
  });

  it('draws the chrome from the palette', () => {
    const chrome = axisChrome(palette);
    expect(chrome.category.border.color).toBe(palette.grid);
    expect(chrome.value.grid.color).toBe(palette.grid);
    expect(chrome.value.ticks.color).toBe(palette.ink);
  });
});
