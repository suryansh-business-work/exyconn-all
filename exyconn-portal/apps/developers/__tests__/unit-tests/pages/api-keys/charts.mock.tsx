import type { Metric } from '@exyconn/shell/components/dashboard/MetricChart';

/** The MetricChart props the usage dialog hands over, as the stand-in records them. */
export interface ChartProps {
  title: string;
  metrics: readonly Metric[];
  formatValue: (value: number) => string;
  labelHeading: string;
  integer?: boolean;
}

/** What the chart stand-in saw on its last render (chart.js does not draw under jsdom). */
export const drawn: { chart: ChartProps | null } = { chart: null };

/** Factory for `vi.mock('@exyconn/shell/components/dashboard/MetricChart', …)`. */
export function metricChartMock() {
  return {
    MetricChart: (props: Readonly<ChartProps>) => {
      drawn.chart = props;
      return (
        <p data-testid="chart">{props.metrics.map((m) => `${m.label}=${m.value}`).join('|')}</p>
      );
    },
  };
}
