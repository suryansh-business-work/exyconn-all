import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  CHART_SEQUENTIAL_DARK,
  CHART_SEQUENTIAL_LIGHT,
  CHART_SERIES_DARK,
  CHART_SERIES_LIGHT,
  chartPalette,
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
    });
  });

  it('selects the dark slots for a dark surface', () => {
    const palette = chartPalette('dark', 's', 'g', 'i', 'k');
    expect(palette.series).toBe(CHART_SERIES_DARK);
    expect(palette.sequential).toBe(CHART_SEQUENTIAL_DARK);
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
    ['light', CHART_SERIES_LIGHT],
    ['dark', CHART_SERIES_DARK],
  ])('follows the %s theme, with chrome from the theme itself', (mode, series) => {
    const theme = createAppTheme(mode);
    const { result } = renderHook(() => useChartPalette(), { wrapper: themed(mode) });
    expect(result.current).toEqual(
      chartPalette(
        mode,
        theme.palette.background.paper,
        theme.palette.divider,
        theme.palette.text.secondary,
        theme.palette.text.primary,
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
