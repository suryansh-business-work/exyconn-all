import type { ReactNode } from 'react';
import type { ChartData } from '@exyconn/shell/components/ui';

interface ChartCardStubProps {
  title: string;
  subtitle?: string;
  labelHeading?: string;
  children: ReactNode;
}

/** Stands in for the design system's ChartCard: its title, subtitle, table heading and chart. */
export function ChartCardStub({
  title,
  subtitle,
  labelHeading,
  children,
}: Readonly<ChartCardStubProps>) {
  return (
    <section aria-label={title}>
      <p>{subtitle}</p>
      <p>{`Table heading: ${labelHeading ?? ''}`}</p>
      {children}
    </section>
  );
}

interface TrendChartStubProps {
  data: ChartData;
  formatValue: (value: number) => string;
}

/** Stands in for the canvas TrendChart (jsdom has no canvas): "label: value" per series. */
export function TrendChartStub({ data, formatValue }: Readonly<TrendChartStubProps>) {
  return (
    <ul>
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
