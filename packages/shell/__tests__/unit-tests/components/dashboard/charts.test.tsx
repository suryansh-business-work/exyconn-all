import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { I18nProvider } from '@exyconn/i18n';
import { MetricChart } from '@/components/dashboard/MetricChart';
import { PointChart } from '@/components/dashboard/PointChart';
import { StatBreakdown } from '@/components/dashboard/StatBreakdown';

interface ChartProps {
  data: { labels: string[]; datasets: { label: string; data: number[] }[] };
}

/** Chart.js needs a canvas jsdom lacks; the stand-in prints what it was asked to draw. */
vi.mock('react-chartjs-2', () => {
  const Drawn = ({ data }: Readonly<ChartProps>) => (
    <output data-testid="chart">
      {JSON.stringify({ labels: data.labels, values: data.datasets.map((set) => set.data) })}
    </output>
  );
  return { Bar: Drawn, Line: Drawn };
});

function drawn(): { labels: string[]; values: number[][] } {
  return JSON.parse(screen.getByTestId('chart').textContent ?? '{}');
}

function renderIn(ui: ReactElement, messages: Record<string, string> = {}) {
  return render(
    <I18nProvider locale="en" messages={messages}>
      {ui}
    </I18nProvider>,
  );
}

const money = (value: number) => `₹${value}`;

describe('MetricChart', () => {
  it('draws one translated series with enum labels as words', () => {
    renderIn(
      <MetricChart
        title="Cost by type"
        subtitle="In rupees"
        labelHeading="Type"
        formatValue={money}
        metrics={[
          { label: 'CLOUD_HOSTING', value: 1200 },
          { label: 'SAAS', value: 300 },
        ]}
      />,
      { 'Cost by type': 'Coste por tipo' },
    );

    expect(screen.getByRole('heading', { name: 'Coste por tipo' })).toBeInTheDocument();
    expect(screen.getByText('In rupees')).toBeInTheDocument();
    expect(drawn()).toEqual({ labels: ['CLOUD HOSTING', 'SAAS'], values: [[1200, 300]] });
  });

  it('shows its table twin formatted as money', async () => {
    const user = userEvent.setup();
    renderIn(
      <MetricChart
        title="Cost"
        labelHeading="Type"
        formatValue={money}
        metrics={[{ label: 'SAAS', value: 300 }]}
        horizontal
        integer
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Show the numbers as a table' }));
    const table = screen.getByRole('table');
    expect(within(table).getByText('Type')).toBeInTheDocument();
    expect(within(table).getByText('₹300')).toBeInTheDocument();
  });

  it('says there is nothing to chart for an empty series', () => {
    renderIn(<MetricChart title="Cost" labelHeading="Type" formatValue={money} metrics={[]} />);
    expect(screen.getByText('Nothing to chart yet.')).toBeInTheDocument();
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  });
});

describe('PointChart', () => {
  it('draws the series over formatted periods', () => {
    renderIn(
      <PointChart
        title="Signups"
        labelHeading="Day"
        formatValue={String}
        formatPeriod={(period) => `day ${period}`}
        points={[
          { period: '2026-10-01', value: 3 },
          { period: '2026-10-02', value: 5 },
        ]}
        integer
      />,
    );

    expect(screen.getByRole('heading', { name: 'Signups' })).toBeInTheDocument();
    expect(drawn()).toEqual({ labels: ['day 2026-10-01', 'day 2026-10-02'], values: [[3, 5]] });
  });

  it('says there is nothing to chart without points', () => {
    renderIn(
      <PointChart
        title="Signups"
        labelHeading="Day"
        formatValue={String}
        formatPeriod={String}
        points={[]}
      />,
    );
    expect(screen.getByText('Nothing to chart yet.')).toBeInTheDocument();
  });
});

describe('StatBreakdown', () => {
  it('orders buckets largest first and humanises enum values', async () => {
    const user = userEvent.setup();
    renderIn(
      <StatBreakdown
        title="Leads by {field}"
        titleValues={{ field: 'stage' }}
        accent="#123456"
        labelHeading="Stage"
        buckets={[
          { value: 'NEW', count: 2 },
          { value: 'IN_REVIEW', count: 1250 },
          { value: 'won', count: 7 },
        ]}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Leads by stage' })).toBeInTheDocument();
    expect(drawn()).toEqual({ labels: ['In review', 'Won', 'New'], values: [[1250, 7, 2]] });

    await user.click(screen.getByRole('button', { name: 'Show the numbers as a table' }));
    expect(screen.getByText('Stage')).toBeInTheDocument();
    expect(screen.getByText((1250).toLocaleString())).toBeInTheDocument();
  });

  it('shows the default empty message and heading', () => {
    renderIn(<StatBreakdown title="Leads" buckets={[]} />, { 'Nothing to show yet.': 'Nada aún.' });
    expect(screen.getByText('Nada aún.')).toBeInTheDocument();
  });

  it('labels the table column Category by default', async () => {
    const user = userEvent.setup();
    renderIn(
      <StatBreakdown title="Leads" buckets={[{ value: 'NEW', count: 2.6 }]} emptyMessage="None" />,
    );

    await user.click(screen.getByRole('button', { name: 'Show the numbers as a table' }));
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
