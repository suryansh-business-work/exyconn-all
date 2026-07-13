import { useMemo } from 'react';
import { Box, useTheme } from '@/components/ui';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register the Chart.js pieces we use, exactly once at module load.
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface LineChartProps {
  labels: string[];
  data: number[];
  color?: string;
  height?: number;
}

/** Reusable themed Chart.js line chart driven by labels + a numeric series. */
export function LineChart({ labels, data, color = '#155dfc', height = 260 }: LineChartProps) {
  const theme = useTheme();
  const grid = theme.palette.divider;
  const text = theme.palette.text.secondary;

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data,
          borderColor: color,
          backgroundColor: `${color}22`,
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 4,
          pointBackgroundColor: color,
        },
      ],
    }),
    [labels, data, color],
  );

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' } },
      scales: {
        x: { grid: { color: grid }, ticks: { color: text } },
        y: { beginAtZero: true, grid: { color: grid }, ticks: { color: text, precision: 0 } },
      },
    }),
    [grid, text],
  );

  return (
    <Box sx={{ height }}>
      <Line data={chartData} options={options} />
    </Box>
  );
}
