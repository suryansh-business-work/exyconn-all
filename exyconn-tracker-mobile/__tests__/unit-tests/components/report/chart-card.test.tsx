import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChartCard } from '../../../../src/components/report/ChartCard';
import { ChartTable } from '../../../../src/components/report/ChartTable';
import { formatHours, type ChartData } from '../../../../src/lib/report/charts';
import { renderWithProviders } from '../../test-utils';
import { getByA11yLabel, queryByA11yLabel } from '../state';

const DATA: ChartData = {
  labels: ['01', '02'],
  series: [
    { id: 'active', label: 'Worked', values: [6.5, 0] },
    // One value short: a missing day reads as nothing, not as a crash.
    { id: 'idle', label: 'Idle', values: [1] },
  ],
};

const EMPTY: ChartData = { labels: [], series: [] };

function renderCard(data: ChartData) {
  return renderWithProviders(
    <ChartCard
      title="Hours this month"
      subtitle="February 2026 · each column is one day"
      data={data}
      formatValue={formatHours}
      labelHeading="Day"
      emptyText="No time tracked this month."
    >
      <div data-testid="the-chart" />
    </ChartCard>,
  );
}

describe('ChartTable', () => {
  it('lays the chart out as a heading row and one row per label', () => {
    renderWithProviders(<ChartTable data={DATA} formatValue={formatHours} labelHeading="Day" />);

    expect(getByA11yLabel('Day, Worked, Idle')).toBeInTheDocument();
    expect(getByA11yLabel('01, 6.5h, 1h')).toBeInTheDocument();
    expect(getByA11yLabel('02, 0h, 0h')).toBeInTheDocument();
  });

  it('formats every cell with the chart’s own formatter', () => {
    renderWithProviders(
      <ChartTable data={DATA} formatValue={(value) => `${value} units`} labelHeading="Day" />,
    );

    expect(screen.getByText('6.5 units')).toBeInTheDocument();
    expect(screen.getAllByText('0 units')).toHaveLength(2);
  });
});

describe('ChartCard', () => {
  it('shows the title, the units line and the chart, with the chart view selected', () => {
    renderCard(DATA);

    expect(screen.getByText('Hours this month')).toBeInTheDocument();
    expect(screen.getByText('February 2026 · each column is one day')).toBeInTheDocument();
    expect(screen.getByTestId('the-chart')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Show as a chart' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('swaps the chart for its table twin, and back', () => {
    renderCard(DATA);

    fireEvent.click(screen.getByRole('tab', { name: 'Show the numbers as a table' }));
    expect(screen.queryByTestId('the-chart')).not.toBeInTheDocument();
    expect(getByA11yLabel('01, 6.5h, 1h')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Show the numbers as a table' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Show as a chart' }));
    expect(screen.getByTestId('the-chart')).toBeInTheDocument();
    expect(queryByA11yLabel('01, 6.5h, 1h')).toBeNull();
  });

  it('names the view switch after the chart it belongs to', () => {
    renderCard(DATA);

    expect(getByA11yLabel('Hours this month — chart or table')).toBeInTheDocument();
  });

  it('says there is nothing to draw instead of a chart of nothing, with no switch', () => {
    renderCard(EMPTY);

    expect(screen.getByText('No time tracked this month.')).toBeInTheDocument();
    expect(screen.queryByTestId('the-chart')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('treats a month of zeros as empty too', () => {
    renderCard({ labels: ['01'], series: [{ id: 'active', label: 'Worked', values: [0] }] });

    expect(screen.getByText('No time tracked this month.')).toBeInTheDocument();
  });

  it('labels the switch in the employee’s language', () => {
    renderWithProviders(
      <ChartCard
        title="Hours"
        subtitle="Units"
        data={DATA}
        formatValue={formatHours}
        labelHeading="Day"
        emptyText="Nothing"
      >
        <div />
      </ChartCard>,
      { messages: { Table: 'Tabelle', 'Show the numbers as a table': 'Als Tabelle zeigen' } },
    );

    expect(screen.getByText('Tabelle')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Als Tabelle zeigen' })).toBeInTheDocument();
  });
});
