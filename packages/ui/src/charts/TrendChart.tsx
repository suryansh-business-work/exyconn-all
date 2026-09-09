import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Box } from '@mui/material';
import { Line } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import './chart-setup';
import { useChartPalette } from './useChartPalette';
import { wash } from './palette';
import { axisChrome, sharedPlugins } from './chart-options';
import type { ChartData, ValueFormatter } from './chart.types';

interface Props {
  data: ChartData;
  formatValue: ValueFormatter;
  /** Washes the area under a single series. Off for multi-series, where fills would collide. */
  area?: boolean;
  height?: number;
}

/**
 * A line chart: change over time.
 *
 * Points carry a 2px ring in the surface colour so they stay legible where two lines cross,
 * and the ring is part of the hit target rather than decoration — an 8px dot you have to land
 * on dead centre is not a hover target.
 */
export function TrendChart({
  data,
  formatValue,
  area = false,
  height = 260,
}: Readonly<Props>): ReactElement {
  const palette = useChartPalette();
  const single = data.series.length === 1;

  const chartData = useMemo(
    () => ({
      labels: [...data.labels],
      datasets: data.series.map((series, index) => {
        const color = series.color ?? palette.series[index % palette.series.length];
        return {
          label: series.label,
          data: [...series.values],
          borderColor: color,
          // A wash, never a saturated block — and only under a lone series.
          backgroundColor: area && single ? wash(color) : 'transparent',
          fill: area && single,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: color,
          pointBorderColor: palette.surface,
          pointBorderWidth: 2,
          pointHitRadius: 16,
        };
      }),
    }),
    [data, palette, area, single],
  );

  const options = useMemo<ChartOptions<'line'>>(() => {
    const chrome = axisChrome(palette, formatValue);
    return {
      responsive: true,
      maintainAspectRatio: false,
      // The crosshair reading: hovering anywhere in a column reports every series at once.
      interaction: { mode: 'index', intersect: false },
      plugins: sharedPlugins(palette, data.series.length, formatValue),
      scales: { x: chrome.category, y: chrome.value },
    } as ChartOptions<'line'>;
  }, [palette, formatValue, data.series.length]);

  return (
    <Box sx={{ height }}>
      <Line data={chartData} options={options} />
    </Box>
  );
}
