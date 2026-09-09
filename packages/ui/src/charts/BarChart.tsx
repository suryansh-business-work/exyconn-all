import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Box } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import './chart-setup';
import { useChartPalette } from './useChartPalette';
import { axisChrome, sharedPlugins } from './chart-options';
import type { ChartData, ValueFormatter } from './chart.types';

interface Props {
  data: ChartData;
  formatValue: ValueFormatter;
  /** Stacks the series into one bar per label — the part-to-whole reading. */
  stacked?: boolean;
  /** Bars run left-to-right. Use it for long category names; they get room to be read. */
  horizontal?: boolean;
  height?: number;
}

/** Mark spec: never fill the slot — the leftover band is air, not a wider bar. */
const MAX_BAR_THICKNESS = 24;
/** The gap that separates touching marks. Surface-coloured, so it reads as white space. */
const GAP = 2;

/**
 * A bar or column chart: magnitude, or part-to-whole when stacked.
 *
 * The 2px gaps between stacked segments are the surface showing through, not borders drawn
 * around each segment — a border adds ink that is not data and makes a stack look like a
 * fence. Only the top segment is rounded, because the rounding marks where the data ends;
 * rounding every segment would put a false end in the middle of the bar.
 */
export function BarChart({
  data,
  formatValue,
  stacked = false,
  horizontal = false,
  height = 260,
}: Readonly<Props>): ReactElement {
  const palette = useChartPalette();

  const chartData = useMemo(() => {
    /**
     * Whether this segment is the visible TOP of its stack.
     *
     * Not simply "the last dataset": a series that is zero on this day draws nothing, so
     * rounding it rounds a segment nobody can see and leaves the real top square. On a month
     * where most days have no off-computer time, that is most of the bars.
     */
    const isStackTop = (seriesIndex: number, valueIndex: number): boolean => {
      if ((data.series[seriesIndex]?.values[valueIndex] ?? 0) <= 0) {
        return false;
      }
      return data.series
        .slice(seriesIndex + 1)
        .every((above) => (above.values[valueIndex] ?? 0) <= 0);
    };

    return {
      labels: [...data.labels],
      datasets: data.series.map((series, index) => ({
        label: series.label,
        data: [...series.values],
        backgroundColor: series.color ?? palette.series[index % palette.series.length],
        // The gap: surface-coloured, only where a segment meets the next one.
        borderColor: palette.surface,
        borderWidth: stacked ? { top: GAP, right: 0, bottom: 0, left: 0 } : 0,
        borderRadius: stacked
          ? (ctx: { dataIndex: number }) => (isStackTop(index, ctx.dataIndex) ? 4 : 0)
          : 4,
        // Square where it grows from the baseline, rounded only at the data end.
        borderSkipped: 'start' as const,
        maxBarThickness: MAX_BAR_THICKNESS,
        categoryPercentage: 0.7,
        barPercentage: 0.9,
      })),
    };
  }, [data, palette, stacked]);

  const options = useMemo<ChartOptions<'bar'>>(() => {
    const chrome = axisChrome(palette, formatValue);
    const category = { ...chrome.category, stacked };
    const value = { ...chrome.value, stacked };
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: horizontal ? ('y' as const) : ('x' as const),
      // The whole bar is the hit target, not just the pixel under the cursor.
      interaction: { mode: 'index', intersect: false },
      plugins: sharedPlugins(palette, data.series.length, formatValue),
      scales: horizontal ? { x: value, y: category } : { x: category, y: value },
    } as ChartOptions<'bar'>;
  }, [palette, formatValue, stacked, horizontal, data.series.length]);

  return (
    <Box sx={{ height }}>
      <Bar data={chartData} options={options} />
    </Box>
  );
}
