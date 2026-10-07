import type { ReactNode } from 'react';
import type { ChartData } from '@exyconn/shell/components/ui';

interface ChartCardStubProps {
  title: string;
  data: ChartData;
  labelHeading?: string;
  emptyText?: string;
  children: ReactNode;
}

/** Stands in for the design system's ChartCard: its title, then its empty text or its chart. */
export function ChartCardStub({
  title,
  data,
  labelHeading,
  emptyText,
  children,
}: Readonly<ChartCardStubProps>) {
  return (
    <section aria-label={title}>
      <p>{`Table heading: ${labelHeading ?? ''}`}</p>
      {data.labels.length === 0 ? <p>{emptyText}</p> : children}
    </section>
  );
}

interface TrendChartStubProps {
  data: ChartData;
  formatValue: (value: number) => string;
}

/**
 * Stands in for the canvas TrendChart (jsdom has no canvas): writes each point as
 * "label: formatted value" per series.
 */
export function TrendChartStub({ data, formatValue }: Readonly<TrendChartStubProps>) {
  return (
    <ul>
      {data.series.map((series) => (
        <li key={series.id}>
          {`${series.label} — `}
          {data.labels
            .map((label, index) => `${label}: ${formatValue(series.values[index] ?? 0)}`)
            .join(', ')}
        </li>
      ))}
    </ul>
  );
}
