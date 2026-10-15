import type { ChartData, ValueFormatter } from '@exyconn/shell/components/ui';

interface ChartStubProps {
  data: ChartData;
  formatValue: ValueFormatter;
  height?: number;
}

/**
 * Stands in for the canvas charts (jsdom has no canvas): one list item per series, each point
 * written as "label: formatted value", and the height the chart was given.
 */
export function ChartStub({ data, formatValue, height }: Readonly<ChartStubProps>) {
  return (
    <ul aria-label="chart" data-height={height}>
      {data.series.map((series) => (
        <li key={series.id}>
          {`${series.label} — `}
          {data.labels
            .map((label, index) => `${label}: ${formatValue(series.values[index])}`)
            .join(', ')}
        </li>
      ))}
    </ul>
  );
}
