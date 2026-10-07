import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrendChart } from '../../../src/charts/TrendChart';
import { ChartLabelContext } from '../../../src/charts/chart-label';
import { CHART_SERIES_LIGHT, wash } from '../../../src/charts/palette';
import type { ChartData } from '../../../src/charts/chart.types';
import { lastCall, type CapturedChart } from './chart-mock';

const calls = vi.hoisted(() => [] as CapturedChart[]);
vi.mock('react-chartjs-2', async () => {
  const { fakeChart } = await import('./chart-mock');
  return { Line: fakeChart('line', calls) };
});

const count = (value: number) => `${value} emails`;
const single: ChartData = {
  labels: ['Jan', 'Feb'],
  series: [{ id: 'sent', label: 'Sent', values: [4, 9] }],
};
const pair: ChartData = {
  labels: ['Jan', 'Feb'],
  series: [
    { id: 'sent', label: 'Sent', values: [4, 9] },
    { id: 'read', label: 'Read', values: [2, 5], color: '#abcdef' },
  ],
};

beforeEach(() => {
  calls.length = 0;
});

describe('TrendChart', () => {
  it('draws a ringed line per series with no wash by default', () => {
    const { container } = render(<TrendChart data={pair} formatValue={count} />);
    const { data, options } = lastCall(calls);
    expect(data.labels).toEqual(['Jan', 'Feb']);
    const [sent, read] = data.datasets;
    expect(sent).toMatchObject({
      label: 'Sent',
      data: [4, 9],
      borderColor: CHART_SERIES_LIGHT[0],
      pointBackgroundColor: CHART_SERIES_LIGHT[0],
      backgroundColor: 'transparent',
      fill: false,
      pointBorderWidth: 2,
    });
    expect(read).toMatchObject({ borderColor: '#abcdef', pointBackgroundColor: '#abcdef' });
    expect(options).toMatchObject({ interaction: { mode: 'index', intersect: false } });
    expect(options.scales?.x).toMatchObject({ grid: { display: false } });
    expect(options.scales?.y).toMatchObject({ beginAtZero: true });
    expect(options.plugins?.legend?.display).toBe(true);
    expect(container.firstElementChild).toHaveStyle({ height: '260px' });
    expect(screen.getByTestId('line')).not.toHaveAttribute('aria-labelledby');
  });

  it('washes the area under a lone series when asked', () => {
    render(<TrendChart data={single} formatValue={count} area height={120} integer />);
    const { data, options } = lastCall(calls);
    expect(data.datasets[0]).toMatchObject({
      backgroundColor: wash(CHART_SERIES_LIGHT[0]),
      fill: true,
    });
    expect(options.scales?.y?.ticks).toMatchObject({ precision: 0 });
    expect(options.plugins?.legend?.display).toBe(false);
  });

  it('never washes when several series would collide', () => {
    render(<TrendChart data={pair} formatValue={count} area />);
    for (const dataset of lastCall(calls).data.datasets) {
      expect(dataset).toMatchObject({ backgroundColor: 'transparent', fill: false });
    }
  });

  it('names the canvas by the heading of its card', () => {
    render(
      <ChartLabelContext.Provider value="trend-heading">
        <TrendChart data={single} formatValue={count} />
      </ChartLabelContext.Provider>,
    );
    expect(screen.getByTestId('line')).toHaveAttribute('aria-labelledby', 'trend-heading');
  });

  it('formats tooltip values with the caller formatter', () => {
    render(<TrendChart data={single} formatValue={count} />);
    const label = lastCall(calls).options.plugins?.tooltip?.callbacks?.label as (
      item: unknown,
    ) => string;
    expect(label({ parsed: { y: 3 }, dataset: { label: 'Sent' } })).toBe('Sent: 3 emails');
  });
});
