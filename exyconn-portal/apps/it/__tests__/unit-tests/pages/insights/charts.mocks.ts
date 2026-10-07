import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import type { Metric } from '@exyconn/shell/components/dashboard/MetricChart';

/** The MetricChart props a page hands over, as the stand-in records them. */
export interface ChartProps {
  title: string;
  subtitle?: string;
  metrics: readonly Metric[];
  formatValue: (value: number) => string;
  labelHeading: string;
  horizontal?: boolean;
  integer?: boolean;
}

/** What the chart and tile stand-ins saw on the last render. */
export const drawn: { charts: ChartProps[]; tiles: StatItem[] | null } = {
  charts: [],
  tiles: null,
};

export function resetDrawn() {
  drawn.charts = [];
  drawn.tiles = null;
}

/** Factory for `vi.mock('@exyconn/shell/components/dashboard/MetricChart', …)`. */
export function metricChartMock() {
  return {
    MetricChart: (props: Readonly<ChartProps>) => {
      drawn.charts = [...drawn.charts.filter((chart) => chart.title !== props.title), props];
      return null;
    },
  };
}

/** Factory for `vi.mock('@exyconn/shell/components/dashboard/StatRow', …)`. */
export function statRowMock() {
  return {
    StatRow: ({ stats }: Readonly<{ stats: StatItem[] }>) => {
      drawn.tiles = stats;
      return null;
    },
  };
}

/** The recorded chart with this title. */
export function chart(title: string): ChartProps {
  const found = drawn.charts.find((candidate) => candidate.title === title);
  if (!found) {
    throw new Error(`No chart titled ${title}`);
  }
  return found;
}

/** The recorded tiles as label/value pairs. */
export function tilePairs(): string[][] {
  return (drawn.tiles ?? []).map((tile) => [tile.label, tile.value]);
}
