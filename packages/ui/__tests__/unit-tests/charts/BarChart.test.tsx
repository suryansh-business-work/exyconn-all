import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarChart } from '../../../src/charts/BarChart';
import { ChartLabelContext } from '../../../src/charts/chart-label';
import { CHART_SERIES_DARK, CHART_SERIES_LIGHT } from '../../../src/charts/palette';
import type { ChartData } from '../../../src/charts/chart.types';
import { renderWithProviders } from '../test-utils';
import { lastCall, type CapturedChart } from './chart-mock';

const calls = vi.hoisted(() => [] as CapturedChart[]);
vi.mock('react-chartjs-2', async () => {
  const { fakeChart } = await import('./chart-mock');
  return { Bar: fakeChart('bar', calls) };
});

const hours = (value: number) => `${value}h`;
const data: ChartData = {
  labels: ['Mon', 'Tue', 'Wed'],
  series: [
    { id: 'worked', label: 'Worked', values: [3, 0, 2] },
    { id: 'idle', label: 'Idle', values: [1, 0, 0], color: '#123456' },
    { id: 'away', label: 'Away', values: [0, 0] },
  ],
};

type Radius = (ctx: { dataIndex: number }) => number;

beforeEach(() => {
  calls.length = 0;
});

describe('BarChart', () => {
  it('draws one rounded, gapless bar per series in palette order', () => {
    const { container } = render(<BarChart data={data} formatValue={hours} />);
    const { data: chart, options } = lastCall(calls);
    expect(chart.labels).toEqual(['Mon', 'Tue', 'Wed']);
    const [worked, idle, away] = chart.datasets;
    expect(worked).toMatchObject({
      label: 'Worked',
      data: [3, 0, 2],
      borderRadius: 4,
      borderWidth: 0,
    });
    expect(worked.backgroundColor).toBe(CHART_SERIES_LIGHT[0]);
    // A series that means something keeps its own colour.
    expect(idle.backgroundColor).toBe('#123456');
    expect(away.backgroundColor).toBe(CHART_SERIES_LIGHT[2]);
    expect(options).toMatchObject({
      indexAxis: 'x',
      interaction: { mode: 'index', intersect: false },
    });
    expect(options.scales?.x).toMatchObject({ stacked: false, grid: { display: false } });
    expect(options.scales?.y).toMatchObject({ stacked: false, beginAtZero: true });
    expect(options.scales?.y?.ticks).not.toHaveProperty('precision');
    expect(options.plugins?.legend?.display).toBe(true);
    expect(container.firstElementChild).toHaveStyle({ height: '260px' });
    // Outside a ChartCard there is no heading to name the canvas by.
    expect(screen.getByTestId('bar')).not.toHaveAttribute('aria-labelledby');
  });

  it('names the canvas by the heading of the card it sits in', () => {
    render(
      <ChartLabelContext.Provider value="heading-7">
        <BarChart data={data} formatValue={hours} />
      </ChartLabelContext.Provider>,
    );
    expect(screen.getByTestId('bar')).toHaveAttribute('aria-labelledby', 'heading-7');
  });

  it('rounds only the visible top of each stack and opens a surface-coloured gap', () => {
    render(<BarChart data={data} formatValue={hours} stacked height={180} />);
    const { data: chart, options } = lastCall(calls);
    const [worked, idle, away] = chart.datasets as unknown as Array<{
      borderRadius: Radius;
      borderWidth: unknown;
    }>;
    expect(worked.borderWidth).toEqual({ top: 2, right: 0, bottom: 0, left: 0 });
    // Monday: idle sits on top of worked, so only idle is rounded.
    expect(worked.borderRadius({ dataIndex: 0 })).toBe(0);
    expect(idle.borderRadius({ dataIndex: 0 })).toBe(4);
    // Wednesday: idle and away are zero, so worked is the visible top.
    expect(worked.borderRadius({ dataIndex: 2 })).toBe(4);
    // Tuesday: nothing is drawn, nothing is rounded.
    expect(idle.borderRadius({ dataIndex: 1 })).toBe(0);
    // A value the series does not have counts as zero.
    expect(away.borderRadius({ dataIndex: 2 })).toBe(0);
    expect(options.scales?.x).toMatchObject({ stacked: true });
    expect(options.scales?.y).toMatchObject({ stacked: true });
  });

  it('treats a missing value above a segment as empty space', () => {
    const ragged: ChartData = {
      labels: ['Mon', 'Tue'],
      series: [
        { id: 'a', label: 'A', values: [1, 5] },
        { id: 'b', label: 'B', values: [2] },
      ],
    };
    render(<BarChart data={ragged} formatValue={hours} stacked />);
    const [first] = lastCall(calls).data.datasets as unknown as Array<{ borderRadius: Radius }>;
    expect(first.borderRadius({ dataIndex: 1 })).toBe(4);
    expect(first.borderRadius({ dataIndex: 0 })).toBe(0);
  });

  it('runs bars left-to-right with the value axis on x when horizontal', () => {
    render(<BarChart data={data} formatValue={hours} horizontal integer />);
    const { options } = lastCall(calls);
    expect(options.indexAxis).toBe('y');
    expect(options.scales?.x).toMatchObject({ beginAtZero: true, ticks: { precision: 0 } });
    expect(options.scales?.y).toMatchObject({ grid: { display: false } });
  });

  it('hides the legend for a single series and wraps the palette past eight', () => {
    const one: ChartData = { labels: ['Mon'], series: [{ id: 'x', label: 'X', values: [1] }] };
    render(<BarChart data={one} formatValue={hours} />);
    expect(lastCall(calls).options.plugins?.legend?.display).toBe(false);

    const nine: ChartData = {
      labels: ['Mon'],
      series: Array.from({ length: 9 }, (_v, index) => ({
        id: `s${index}`,
        label: `S${index}`,
        values: [index],
      })),
    };
    render(<BarChart data={nine} formatValue={hours} />);
    expect(lastCall(calls).data.datasets[8].backgroundColor).toBe(CHART_SERIES_LIGHT[0]);
  });

  it('paints with the dark palette under a dark theme', () => {
    renderWithProviders(<BarChart data={data} formatValue={hours} />, { mode: 'dark' });
    expect(lastCall(calls).data.datasets[0].backgroundColor).toBe(CHART_SERIES_DARK[0]);
  });
});
