import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  CHART_SEQUENTIAL_DARK,
  CHART_SEQUENTIAL_LIGHT,
  CHART_SERIES_DARK,
  CHART_SERIES_LIGHT,
  PASTEL_CHART,
  areaFill,
  barFill,
  chartPalette,
  fadeFill,
  wash,
} from '../../../src/charts/palette';
import { useChartPalette } from '../../../src/charts/useChartPalette';
import { useChartLabel } from '../../../src/charts/chart-label';
import { createAppTheme } from '../../../src/theme';
import { ThemeProvider } from '../../../src/tokens/ThemeProvider';
import type { ColorMode } from '../../../src/tokens/modes';

describe('chartPalette', () => {
  it('selects the light slots for a light surface', () => {
    expect(chartPalette('light', 's', 'g', 'i', 'k')).toEqual({
      series: CHART_SERIES_LIGHT,
      sequential: CHART_SEQUENTIAL_LIGHT,
      surface: 's',
      grid: 'g',
      ink: 'i',
      inkStrong: 'k',
      gradient: false,
    });
  });

  it('draws a theme s own set with gradient fills', () => {
    const palette = chartPalette('light', 's', 'g', 'i', 'k', PASTEL_CHART.light);
    expect(palette.series).toBe(PASTEL_CHART.light.series);
    expect(palette.sequential).toBe(PASTEL_CHART.light.sequential);
    expect(palette.gradient).toBe(true);
  });

  it('selects the dark slots for a dark surface', () => {
    const palette = chartPalette('dark', 's', 'g', 'i', 'k');
    expect(palette.series).toBe(CHART_SERIES_DARK);
    expect(palette.sequential).toBe(CHART_SEQUENTIAL_DARK);
  });
});

/** A canvas context that records the gradient it was asked for. */
function fakeChart(area?: { top: number; bottom: number; left: number; right: number }) {
  const stops: Array<[number, string]> = [];
  const lines: number[][] = [];
  const gradient = {
    addColorStop: (offset: number, colour: string) => stops.push([offset, colour]),
  };
  const ctx = {
    createLinearGradient: (...coords: number[]) => {
      lines.push(coords);
      return gradient;
    },
  } as unknown as CanvasRenderingContext2D;
  return { chart: { ctx, chartArea: area }, stops, lines, gradient };
}

describe('fadeFill', () => {
  const area = { top: 10, bottom: 110, left: 5, right: 205 };

  it('stands in a flat wash until the plot area is laid out', () => {
    expect(fadeFill('#3366ff', 0.8, 0)(fakeChart())).toBe('rgba(51, 102, 255, 0.8)');
  });

  it('fades top to bottom across the plot area', () => {
    const fake = fakeChart(area);
    expect(fadeFill('#3366ff', 1, 0.5)(fake)).toBe(fake.gradient);
    expect(fake.lines[0]).toEqual([0, 10, 0, 110]);
    expect(fake.stops).toEqual([
      [0, 'rgba(51, 102, 255, 1)'],
      [1, 'rgba(51, 102, 255, 0.5)'],
    ]);
  });

  it('fades from the data end to the baseline when the bars run sideways', () => {
    const fake = fakeChart(area);
    fadeFill('#3366ff', 1, 0.5, true)(fake);
    expect(fake.lines[0]).toEqual([205, 0, 5, 0]);
  });
});

describe('barFill and areaFill', () => {
  const flat = chartPalette('light', 's', 'g', 'i', 'k');
  const soft = chartPalette('light', 's', 'g', 'i', 'k', PASTEL_CHART.light);

  it('keeps flat marks for the default set', () => {
    expect(barFill(flat, '#3366ff', false)).toBe('#3366ff');
    expect(areaFill(flat, '#3366ff', 0.2)).toBe('rgba(51, 102, 255, 0.2)');
  });

  it('fills the pastel set with gradients', () => {
    expect(typeof barFill(soft, '#3366ff', false)).toBe('function');
    const fill = areaFill(soft, '#3366ff', 0.2) as ReturnType<typeof fadeFill>;
    expect(fill(fakeChart())).toMatch(/^rgba\(51, 102, 255, 0\.7/);
  });
});

describe('wash', () => {
  it('turns a hex colour into a 10% rgba by default', () => {
    expect(wash('#3366ff')).toBe('rgba(51, 102, 255, 0.1)');
  });

  it('takes another alpha', () => {
    expect(wash('#000000', 0.2)).toBe('rgba(0, 0, 0, 0.2)');
    expect(wash('#ffffff', 1)).toBe('rgba(255, 255, 255, 1)');
  });
});

function themed(mode: ColorMode) {
  const theme = createAppTheme(mode);
  return function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
  };
}

describe('useChartPalette', () => {
  it.each<[ColorMode, readonly string[]]>([
    ['light', PASTEL_CHART.light.series],
    ['dark', PASTEL_CHART.dark.series],
  ])('follows the %s theme, with its pastels and chrome from the theme itself', (mode, series) => {
    const theme = createAppTheme(mode);
    const { result } = renderHook(() => useChartPalette(), { wrapper: themed(mode) });
    expect(result.current).toEqual(
      chartPalette(
        mode,
        theme.palette.background.paper,
        theme.palette.divider,
        theme.palette.text.secondary,
        theme.palette.text.primary,
        PASTEL_CHART[mode],
      ),
    );
    expect(result.current.series).toBe(series);
  });
});

describe('useChartLabel', () => {
  it('names nothing outside a chart card', () => {
    const { result } = renderHook(() => useChartLabel());
    expect(result.current).toEqual({});
  });
});
