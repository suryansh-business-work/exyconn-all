import { describe, expect, it, vi } from 'vitest';
import { interpolate, type Interpolations } from '@exyconn/i18n';
import {
  countChart,
  dailyChart,
  flowRows,
  funnelChart,
  percentOf,
} from '../../../../src/admin/analytics/analytics.data';
import { demoStats } from '../admin.fixtures';

/** A translator that marks what it translated, so the tests see every string go through it. */
const t = (source: string, values?: Interpolations) => `[${interpolate(source, values)}]`;
const pct = (value: number) => `${Math.round(value)}%`;

describe('percentOf', () => {
  it('is the share as 0-100, and 0 when there is no whole', () => {
    expect(percentOf(1, 4)).toBe(25);
    expect(percentOf(3, 3)).toBe(100);
    expect(percentOf(5, 0)).toBe(0);
    expect(percentOf(0, -1)).toBe(0);
  });
});

describe('dailyChart', () => {
  it('labels each day with the formatter and charts three translated series', () => {
    const formatDay = vi.fn((value: Date) => `${value.getDate()}/${value.getMonth() + 1}`);
    const chart = dailyChart(
      [
        { date: '2026-10-01', sessions: 4, flowsStarted: 3, flowsCompleted: 2 },
        { date: '2026-10-02', sessions: 1, flowsStarted: 0, flowsCompleted: 0 },
      ],
      formatDay,
      t,
    );
    expect(chart.labels).toEqual(['1/10', '2/10']);
    expect(chart.series).toEqual([
      { id: 'sessions', label: '[Sessions]', values: [4, 1] },
      { id: 'flowsStarted', label: '[Flows started]', values: [3, 0] },
      { id: 'flowsCompleted', label: '[Flows completed]', values: [2, 0] },
    ]);
  });
});

describe('countChart', () => {
  it('is one series of counts under the given label', () => {
    expect(
      countChart(
        [
          { key: 'phone', label: 'Phone', count: 10 },
          { key: 'desktop', label: 'Desktop', count: 2 },
        ],
        'Sessions',
      ),
    ).toEqual({
      labels: ['Phone', 'Desktop'],
      series: [{ id: 'count', label: 'Sessions', values: [10, 2] }],
    });
  });
});

describe('flowRows', () => {
  it('puts the most-started flow first, with its industry and completion share', () => {
    const flows = demoStats().flows;
    const rows = flowRows(flows, (key) => (key === 'clinic' ? 'Healthcare' : key));
    expect(rows).toEqual([
      {
        id: 'salon:haircut',
        demoKey: 'salon',
        workflow: 'haircut',
        industry: 'salon',
        name: 'Haircut',
        started: 20,
        completed: 20,
        abandoned: 0,
        completionPct: 100,
      },
      {
        id: 'clinic:book-visit',
        demoKey: 'clinic',
        workflow: 'book-visit',
        industry: 'Healthcare',
        name: 'Book a visit',
        started: 10,
        completed: 5,
        abandoned: 5,
        completionPct: 50,
      },
    ]);
    // The server's order is left alone.
    expect(flows[0].workflow).toBe('book-visit');
  });

  it('calls a flow nobody started 0% complete', () => {
    const [row] = flowRows(
      [{ demoKey: 'x', workflow: 'w', name: 'W', started: 0, completed: 0, abandoned: 0 }],
      (key) => key,
    );
    expect(row.completionPct).toBe(0);
  });
});

describe('funnelChart', () => {
  it('numbers each step and writes the drop-off from the one before into its label', () => {
    const chart = funnelChart(
      [
        { node: 'a', label: 'Welcome', sessions: 10 },
        { node: 'b', label: 'Pick a slot', sessions: 4 },
        { node: 'c', label: 'Pick a slot', sessions: 4 },
      ],
      pct,
      t,
    );
    expect(chart.labels).toEqual([
      '[1. Welcome]',
      '[2. Pick a slot (60% drop-off)]',
      '[3. Pick a slot (0% drop-off)]',
    ]);
    expect(chart.series).toEqual([
      { id: 'sessions', label: '[Sessions reaching the step]', values: [10, 4, 4] },
    ]);
  });

  it('never reports a negative drop-off, and treats a step after nobody as a full drop', () => {
    const chart = funnelChart(
      [
        { node: 'a', label: 'A', sessions: 0 },
        { node: 'b', label: 'B', sessions: 3 },
        { node: 'c', label: 'C', sessions: 6 },
      ],
      pct,
      t,
    );
    expect(chart.labels).toEqual(['[1. A]', '[2. B (100% drop-off)]', '[3. C (0% drop-off)]']);
  });

  it('is empty for a flow nobody entered', () => {
    expect(funnelChart([], pct, t).labels).toEqual([]);
  });
});
