import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { ChartData } from '@exyconn/shell/components/ui';
import {
  TrackerBillingChart,
  type BillingBar,
} from '../../../../src/pages/tracker/TrackerBillingChart';
import { renderWithProviders } from '../../test-utils';

interface CardProps {
  title: string;
  subtitle: string;
  data: ChartData;
  formatValue: (value: number) => string;
  labelHeading: string;
  emptyText: string;
  children: ReactNode;
}

interface BarProps {
  data: ChartData;
  formatValue: (value: number) => string;
  horizontal: boolean;
  height: number;
}

const drawn = vi.hoisted(() => ({ card: null as unknown, bar: null as unknown }));

/** jsdom has no canvas: the card and the bars are recorded rather than drawn. */
vi.mock('@exyconn/shell/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/ui')>()),
  ChartCard: (props: Readonly<CardProps>) => {
    drawn.card = props;
    return <section aria-label={props.title}>{props.children}</section>;
  },
  BarChart: (props: Readonly<BarProps>) => {
    drawn.bar = props;
    return null;
  },
}));

const card = () => drawn.card as CardProps;
const bar = () => drawn.bar as BarProps;

const bars = (entries: ReadonlyArray<[string, number]>): BillingBar[] =>
  entries.map(([name, hours]) => ({ id: name.toLowerCase(), name, hours }));

const renderChart = (rows: BillingBar[], messages = {}) =>
  renderWithProviders(
    <TrackerBillingChart
      rows={rows}
      title="Billable hours by employee"
      subtitle="Tracked active time plus approved off-computer time"
      labelHeading="Employee"
    />,
    { messages },
  );

describe('TrackerBillingChart', () => {
  beforeEach(() => {
    drawn.card = null;
    drawn.bar = null;
  });

  it('ranks the bars biggest first, to a tenth of an hour, as one series', () => {
    renderChart(
      bars([
        ['Dev', 2],
        ['Asha', 12.34],
        ['Mo', 0],
        ['Chen', 7.25],
      ]),
    );
    expect(card().data).toEqual({
      labels: ['Asha', 'Chen', 'Dev'],
      series: [{ id: 'hours', label: 'Hours', values: [12.3, 7.3, 2] }],
    });
    expect(bar().data).toBe(card().data);
    expect(bar().horizontal).toBe(true);
    expect(bar().height).toBe(160);
    expect(card().formatValue(7.5)).toBe('7.5h');
    expect(bar().formatValue(3)).toBe('3h');
  });

  it('folds everything past the top ten into one "Other" bar', () => {
    const many = bars([
      ['Kiran', 2.06],
      ['Asha', 12],
      ['Bala', 11],
      ['Chen', 10],
      ['Lata', 1.01],
      ['Dev', 9],
      ['Esha', 8],
      ['Farid', 7],
      ['Gita', 6],
      ['Hari', 5],
      ['Ira', 4],
      ['Jai', 3],
    ]);
    renderChart(many);
    const { labels, series } = card().data;
    expect(labels).toEqual([
      'Asha',
      'Bala',
      'Chen',
      'Dev',
      'Esha',
      'Farid',
      'Gita',
      'Hari',
      'Ira',
      'Jai',
      'Other',
    ]);
    expect(series[0].values).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 3.1]);
    expect(bar().height).toBe(11 * 28 + 60);
  });

  it('draws nothing for a period with no billable hours, and says so', () => {
    renderChart(bars([['Asha', 0]]));
    expect(card().data).toEqual({
      labels: [],
      series: [{ id: 'hours', label: 'Hours', values: [] }],
    });
    expect(card().emptyText).toBe('No billable hours in this period.');
    expect(bar().height).toBe(160);
  });

  it('heads the card in the reader’s language', () => {
    renderChart(bars([['Asha', 4]]), {
      'Billable hours by employee': 'Heures facturables par employé',
      Employee: 'Employé',
      Hours: 'Heures',
    });
    expect(
      screen.getByRole('region', { name: 'Heures facturables par employé' }),
    ).toBeInTheDocument();
    expect(card().subtitle).toBe('Tracked active time plus approved off-computer time');
    expect(card().labelHeading).toBe('Employé');
    expect(card().data.series[0].label).toBe('Heures');
  });
});
