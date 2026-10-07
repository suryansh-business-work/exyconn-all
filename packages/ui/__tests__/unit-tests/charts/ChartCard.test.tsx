import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChartCard } from '../../../src/charts/ChartCard';
import { useChartLabel } from '../../../src/charts/chart-label';
import type { ChartData } from '../../../src/charts/chart.types';
import { renderWithProviders } from '../test-utils';

const data: ChartData = {
  labels: ['Mon', 'Tue'],
  series: [{ id: 'worked', label: 'Worked', values: [2, 3] }],
};
const hours = (value: number) => `${value}h`;

/** Stands in for a chart: shows the label it would put on its canvas. */
function LabelledChild() {
  const label = useChartLabel();
  return <div data-testid="chart" aria-labelledby={label['aria-labelledby']} />;
}

function card(chartData: ChartData, extra: Partial<{ subtitle: string; emptyText: string }> = {}) {
  return (
    <ChartCard title="Hours" data={chartData} formatValue={hours} labelHeading="Day" {...extra}>
      <LabelledChild />
    </ChartCard>
  );
}

describe('ChartCard', () => {
  it('heads the chart with a real h2 and names the chart by it', () => {
    render(card(data));
    const heading = screen.getByRole('heading', { level: 2, name: 'Hours' });
    expect(screen.getByTestId('chart')).toHaveAttribute('aria-labelledby', heading.id);
    expect(heading.id).not.toBe('');
  });

  it('shows the subtitle only when one is given', () => {
    const { unmount } = render(card(data, { subtitle: 'Hours per day' }));
    expect(screen.getByText('Hours per day')).toBeInTheDocument();
    unmount();
    render(card(data));
    expect(screen.queryByText('Hours per day')).not.toBeInTheDocument();
  });

  it('switches to the table twin and back', () => {
    render(card(data));
    const group = screen.getByRole('group', { name: 'Hours — chart or table' });
    expect(group).toBeInTheDocument();
    const chartButton = screen.getByRole('button', { name: 'Show as a chart' });
    expect(chartButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Show the numbers as a table' }));
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '3h' })).toBeInTheDocument();

    fireEvent.click(chartButton);
    expect(screen.getByTestId('chart')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('keeps the current view when the pressed button is pressed again', () => {
    render(card(data));
    fireEvent.click(screen.getByRole('button', { name: 'Show as a chart' }));
    expect(screen.getByTestId('chart')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show as a chart' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it.each<[string, ChartData]>([
    ['no labels', { labels: [], series: data.series }],
    ['no series', { labels: ['Mon'], series: [] }],
    ['all zeros', { labels: ['Mon'], series: [{ id: 'a', label: 'A', values: [0] }] }],
  ])('says so in a sentence instead of drawing %s', (_name, empty) => {
    render(card(empty));
    expect(screen.getByText('Nothing tracked in this period.')).toBeInTheDocument();
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('uses the caller empty text when given', () => {
    render(card({ labels: [], series: [] }, { emptyText: 'No email sent yet.' }));
    expect(screen.getByText('No email sent yet.')).toBeInTheDocument();
  });

  it('translates its own chrome', () => {
    renderWithProviders(card(data), {
      messages: {
        'Show as a chart': 'Als Diagramm',
        'Show the numbers as a table': 'Als Tabelle',
        '{title} — chart or table': '{title} — Diagramm oder Tabelle',
      },
    });
    expect(screen.getByRole('button', { name: 'Als Diagramm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Als Tabelle' })).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Hours — Diagramm oder Tabelle' }),
    ).toBeInTheDocument();
  });
});
