import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';

/**
 * Registers the Chart.js pieces this package draws with, exactly once at module load.
 *
 * Chart.js v4 is tree-shakeable and registers nothing by default, so a controller that is not
 * registered fails at render with a message that names the scale rather than the chart. Every
 * chart component in this folder imports this module for the side effect.
 */
Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
);

export { Chart };
