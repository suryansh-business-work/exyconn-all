import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketTrendChart } from '../../../../src/pages/insights/TicketTrendChart';
import { renderWithProviders } from '../../test-utils';

interface LineProps {
  data: { labels: string[]; datasets: Array<{ label: string; data: number[] }> };
}

/** Chart.js needs a canvas jsdom lacks; the stand-in prints what it was asked to draw. */
vi.mock('react-chartjs-2', () => ({
  Line: ({ data }: Readonly<LineProps>) => (
    <output data-testid="line">
      {JSON.stringify({
        labels: data.labels,
        series: data.datasets.map((set) => [set.label, set.data]),
      })}
    </output>
  ),
}));

const drawnLine = () => JSON.parse(screen.getByTestId('line').textContent ?? '{}');

describe('TicketTrendChart', () => {
  it('draws IT tickets opened and resolved per month', () => {
    renderWithProviders(
      <TicketTrendChart
        points={[
          { period: '2026-08', opened: 12, resolved: 9 },
          { period: '2026-09', opened: 7, resolved: 11 },
        ]}
      />,
    );
    expect(screen.getByRole('heading', { name: 'IT tickets per month' })).toBeInTheDocument();
    expect(drawnLine()).toEqual({
      labels: ['2026-08', '2026-09'],
      series: [
        ['Opened', [12, 7]],
        ['Resolved', [9, 11]],
      ],
    });
  });

  it('reads the same counts as a table, rounded and grouped', async () => {
    renderWithProviders(
      <TicketTrendChart points={[{ period: '2026-09', opened: 1234.4, resolved: 2.6 }]} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Show the numbers as a table' }));
    const row = screen.getByRole('row', { name: /2026-09/ });
    expect(within(row).getByText((1234).toLocaleString())).toBeInTheDocument();
    expect(within(row).getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Month' })).toBeInTheDocument();
  });

  it('says there were no tickets instead of drawing an empty chart', () => {
    renderWithProviders(<TicketTrendChart points={[]} />);
    expect(screen.getByText('No IT tickets in this period.')).toBeInTheDocument();
    expect(screen.queryByTestId('line')).not.toBeInTheDocument();
  });
});
