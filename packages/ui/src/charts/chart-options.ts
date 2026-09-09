import type { ChartOptions, ScaleOptionsByType, TooltipItem } from 'chart.js';
import type { ChartPalette } from './palette';
import type { ValueFormatter } from './chart.types';

/**
 * Grid and axis chrome, shared by every chart so they read as one system.
 *
 * Hairline, solid and one step off the surface. Never dashed: a dashed rule reads as a
 * threshold or a projection, and a grid is neither — it is the quietest thing on the chart.
 */
export function axisChrome(palette: ChartPalette, format?: ValueFormatter) {
  return {
    category: {
      grid: { display: false },
      border: { color: palette.grid },
      ticks: { color: palette.ink, font: { size: 11 }, autoSkipPadding: 8 },
    },
    value: {
      beginAtZero: true,
      grid: { color: palette.grid, lineWidth: 1, drawTicks: false },
      border: { display: false },
      ticks: {
        color: palette.ink,
        font: { size: 11 },
        maxTicksLimit: 5,
        callback: (value: string | number) =>
          format ? format(typeof value === 'number' ? value : Number(value)) : value,
      },
    },
  } satisfies Record<string, unknown>;
}

/** Legend and tooltip settings shared by every chart. */
export function sharedPlugins(
  palette: ChartPalette,
  seriesCount: number,
  format: ValueFormatter,
): ChartOptions<'bar' | 'line'>['plugins'] {
  return {
    legend: {
      // Two or more series always get a legend; one never does — the title already names it,
      // and a one-swatch box just restates the title.
      display: seriesCount > 1,
      position: 'bottom' as const,
      labels: {
        // Legend TEXT wears the ink token. Identity comes from the swatch beside it, never
        // from colouring the words — a light slot is illegible as text on the surface.
        color: palette.ink,
        usePointStyle: true,
        pointStyle: 'circle' as const,
        boxWidth: 8,
        boxHeight: 8,
        padding: 16,
        font: { size: 11 },
      },
    },
    tooltip: {
      backgroundColor: palette.surface,
      titleColor: palette.inkStrong,
      bodyColor: palette.ink,
      borderColor: palette.grid,
      borderWidth: 1,
      padding: 10,
      usePointStyle: true,
      boxPadding: 4,
      callbacks: {
        label: (item: TooltipItem<'bar' | 'line'>) => {
          // A horizontal bar reports its magnitude on x; everything else on y.
          const value = item.parsed.y ?? item.parsed.x ?? 0;
          return `${item.dataset.label ?? ''}: ${format(value)}`;
        },
      },
    },
  };
}

export type ValueScale = ScaleOptionsByType<'linear'>;
