import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChartAxes } from '../../../../src/components/report/ChartAxes';
import { StackedBarChart } from '../../../../src/components/report/StackedBarChart';
import { TrendLineChart } from '../../../../src/components/report/TrendLineChart';
import { plotArea } from '../../../../src/lib/report/chart-geometry';
import { formatHours, formatPercent, type ChartData } from '../../../../src/lib/report/charts';
import { renderWithProviders } from '../../test-utils';
import { getByA11yLabel } from '../state';

/** The width the chart's box was laid out at; 0 is "not measured yet". */
const measured = vi.hoisted(() => ({ width: 0 }));

vi.mock('../../../../src/hooks/useMeasuredWidth', () => ({
  useMeasuredWidth: () => [measured.width, () => undefined],
}));

beforeEach(() => {
  measured.width = 320;
});

const DAYS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];

function texts(container: HTMLElement): string[] {
  return [...container.querySelectorAll('text')].map((node) => node.textContent ?? '');
}

describe('ChartAxes', () => {
  // 240 × 120 leaves a 196 × 92 plot, its baseline at y = 100.
  const plot = plotArea(240, 120);

  it('draws a gridline and a value tick at zero, half and the top', () => {
    const { container } = renderWithProviders(
      <svg>
        <ChartAxes plot={plot} max={10} labels={[]} formatValue={formatHours} />
      </svg>,
    );

    const lines = [...container.querySelectorAll('line')];
    expect(lines.map((line) => line.getAttribute('y1'))).toEqual(['100', '54', '8']);
    expect(lines[0]).toHaveAttribute('x1', '40');
    expect(lines[0]).toHaveAttribute('x2', '236');
    expect(texts(container)).toEqual(['0h', '5h', '10h']);
  });

  it('labels every other day when a month has more days than fit', () => {
    const { container } = renderWithProviders(
      <svg>
        <ChartAxes plot={plot} max={10} labels={DAYS} formatValue={formatHours} />
      </svg>,
    );

    expect(texts(container).slice(3)).toEqual(['01', '03', '05', '07', '09']);
  });

  it('keeps every gridline on the baseline when there is no value to scale to', () => {
    const { container } = renderWithProviders(
      <svg>
        <ChartAxes plot={plot} max={0} labels={['01']} formatValue={formatHours} />
      </svg>,
    );

    const lines = [...container.querySelectorAll('line')];
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line).toHaveAttribute('y1', '100');
    }
  });
});

const STACKED: ChartData = {
  labels: ['01', '02'],
  series: [
    { id: 'active', label: 'Worked', values: [6, 0], color: '#111111' },
    { id: 'idle', label: 'Idle', values: [2, 0], color: '#999999' },
  ],
};

describe('StackedBarChart', () => {
  it('stacks each day’s series in its own colour, and draws nothing for an empty day', () => {
    const { container } = renderWithProviders(
      <StackedBarChart
        data={STACKED}
        formatValue={formatHours}
        height={200}
        accessibilityLabel="Hours"
      />,
    );

    const rects = [...container.querySelectorAll('rect')];
    expect(rects.map((rect) => rect.getAttribute('fill'))).toEqual(['#111111', '#999999']);
    // Idle sits on top of worked: its segment starts higher up the chart.
    expect(Number(rects[1].getAttribute('y'))).toBeLessThan(Number(rects[0].getAttribute('y')));
  });

  it('rounds the axis up to a readable ceiling', () => {
    const { container } = renderWithProviders(
      <StackedBarChart
        data={STACKED}
        formatValue={formatHours}
        height={200}
        accessibilityLabel="Hours"
      />,
    );

    expect(texts(container)).toContain('10h');
  });

  it('is one image to a screen reader, with a legend beside it', () => {
    renderWithProviders(
      <StackedBarChart
        data={STACKED}
        formatValue={formatHours}
        height={200}
        accessibilityLabel="Hours this month"
      />,
    );

    expect(getByA11yLabel('Hours this month')).toBeInTheDocument();
    expect(screen.getByText('Worked')).toBeInTheDocument();
    expect(screen.getByText('Idle')).toBeInTheDocument();
  });

  it('waits for its width before drawing, keeping the legend', () => {
    measured.width = 0;
    const { container } = renderWithProviders(
      <StackedBarChart
        data={STACKED}
        formatValue={formatHours}
        height={200}
        accessibilityLabel="Hours"
      />,
    );

    expect(container.querySelector('svg')).toBeNull();
    expect(screen.getByText('Worked')).toBeInTheDocument();
  });
});

describe('TrendLineChart', () => {
  const series = { id: 'activity', label: 'Activity', values: [50, 100, 0], color: '#123456' };

  function renderTrend() {
    return renderWithProviders(
      <TrendLineChart
        labels={['01', '02', '03']}
        series={series}
        max={100}
        formatValue={formatPercent}
        height={180}
        accessibilityLabel="Activity this month"
      />,
    );
  }

  it('draws a dot per day, a line through them and a soft area under it', () => {
    const { container } = renderTrend();

    const dots = [...container.querySelectorAll('circle')];
    expect(dots).toHaveLength(3);
    expect(dots.every((dot) => dot.getAttribute('fill') === '#123456')).toBe(true);
    const [area, line] = [...container.querySelectorAll('path')];
    expect(area.getAttribute('d')).toMatch(/Z$/);
    expect(area).toHaveAttribute('fill-opacity', '0.15');
    expect(line).toHaveAttribute('stroke', '#123456');
    expect(line.getAttribute('d')).toMatch(/^M/);
  });

  it('puts a full day at the top of the plot and an empty one on the baseline', () => {
    const { container } = renderTrend();

    const plot = plotArea(320, 180);
    const [, full, empty] = [...container.querySelectorAll('circle')];
    expect(full).toHaveAttribute('cy', String(plot.top));
    expect(empty).toHaveAttribute('cy', String(plot.top + plot.height));
  });

  it('reads as one sentence, and draws nothing until it has a width', () => {
    measured.width = 0;
    const { container } = renderTrend();

    expect(getByA11yLabel('Activity this month')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();
  });
});
