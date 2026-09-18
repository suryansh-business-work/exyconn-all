import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Box } from '@mui/material';
import { Line } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import './chart-setup';
import { useChartPalette } from './useChartPalette';
import { wash } from './palette';

interface Props {
  /** Oldest first. Fewer than two points is not a trend, so nothing is drawn. */
  values: readonly number[];
  /** The line's colour. Defaults to the palette's first slot. */
  color?: string;
  height?: number;
  /** Washes the area under the line. */
  area?: boolean;
}

/**
 * A sparkline: the shape of a trend beside a number that already states it — a stat tile's
 * value, a panel's total. No axes, no tooltip, no legend: it is read at a glance or not at all.
 *
 * Hidden from assistive technology, because the number it decorates is the information; a
 * trend a reader needs to READ belongs in a `ChartCard` with a `TrendChart` and its table.
 */
export function Sparkline({
  values,
  color,
  height = 32,
  area = true,
}: Readonly<Props>): ReactElement | null {
  const palette = useChartPalette();
  const stroke = color ?? palette.series[0];

  const chartData = useMemo(
    () => ({
      labels: values.map((_value, index) => String(index)),
      datasets: [
        {
          data: [...values],
          borderColor: stroke,
          backgroundColor: area ? wash(stroke, 0.2) : 'transparent',
          fill: area,
          borderWidth: 1.5,
          tension: 0.35,
          pointRadius: 0,
        },
      ],
    }),
    [values, stroke, area],
  );

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      events: [],
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
      layout: { padding: { top: 2, bottom: 2 } },
    }),
    [],
  );

  if (values.length < 2) {
    return null;
  }
  return (
    <Box aria-hidden sx={{ height, width: '100%' }}>
      <Line data={chartData} options={options} />
    </Box>
  );
}
