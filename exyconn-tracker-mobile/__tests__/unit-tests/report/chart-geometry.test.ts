import { describe, expect, it } from 'vitest';
import {
  STACK_GAP,
  areaPath,
  labelStep,
  linePath,
  linePoints,
  niceCeiling,
  plotArea,
  slotCenters,
  stackedColumns,
  stackedMax,
  ticks,
  type PlotArea,
} from '../../../src/lib/report/chart-geometry';
import type { ChartData } from '../../../src/lib/report/charts';

const PLOT: PlotArea = { left: 0, top: 0, width: 100, height: 100 };

const DATA: ChartData = {
  labels: ['01', '02'],
  series: [
    { id: 'active', label: 'Worked', values: [6, 0] },
    { id: 'idle', label: 'Idle', values: [2, 4] },
  ],
};

describe('plotArea', () => {
  it('leaves gutters for the ticks and labels, and never goes negative', () => {
    const plot = plotArea(300, 200);
    expect(plot.left).toBeGreaterThan(0);
    expect(plot.width).toBeLessThan(300);
    expect(plot.height).toBeLessThan(200);
    expect(plotArea(0, 0)).toMatchObject({ width: 0, height: 0 });
  });
});

describe('niceCeiling', () => {
  it('rounds an axis up to 1, 2, 2.5 or 5 of its power of ten', () => {
    expect(niceCeiling(7.3)).toBe(10);
    expect(niceCeiling(8)).toBe(10);
    expect(niceCeiling(4.2)).toBe(5);
    expect(niceCeiling(2.2)).toBe(2.5);
    expect(niceCeiling(12)).toBe(20);
  });

  it('gives an empty chart a unit axis instead of dividing by zero', () => {
    expect(niceCeiling(0)).toBe(1);
  });
});

describe('stackedMax', () => {
  it('is the tallest day, worked and idle added', () => {
    expect(stackedMax(DATA)).toBe(8);
  });
});

describe('ticks and labels', () => {
  it('splits the axis into equal steps from zero', () => {
    expect(ticks(10, 2)).toEqual([0, 5, 10]);
  });

  it('thins 31 day labels to at most the room there is', () => {
    expect(labelStep(31, 8)).toBe(4);
    expect(labelStep(5, 8)).toBe(1);
  });

  it('centres each label in its slot', () => {
    expect(slotCenters(2, PLOT)).toEqual([25, 75]);
  });
});

describe('stackedColumns', () => {
  it('stacks idle on worked, with the surface showing through between them', () => {
    const [first] = stackedColumns(DATA, 10, PLOT);

    expect(first.segments.map((segment) => segment.seriesId)).toEqual(['active', 'idle']);
    expect(first.segments[0]).toEqual({ seriesId: 'active', y: 40, height: 60 });
    expect(first.segments[1]).toEqual({ seriesId: 'idle', y: 20, height: 20 - STACK_GAP });
  });

  it('draws nothing for a zero value, so the stack does not start on a gap', () => {
    const [, second] = stackedColumns(DATA, 10, PLOT);

    expect(second.segments).toEqual([{ seriesId: 'idle', y: 60, height: 40 }]);
  });

  it('centres a column no wider than its slot allows', () => {
    const [first] = stackedColumns(DATA, 10, PLOT);

    expect(first.width).toBeLessThanOrEqual(50);
    expect(first.x + first.width / 2).toBeCloseTo(25);
  });
});

describe('line paths', () => {
  it('places 0% on the baseline and 100% at the top', () => {
    expect(linePoints([0, 100], 100, PLOT)).toEqual([
      { x: 25, y: 100 },
      { x: 75, y: 0 },
    ]);
  });

  it('draws the line and closes the area down to the baseline', () => {
    const points = linePoints([0, 100], 100, PLOT);

    expect(linePath(points)).toBe('M25 100 L75 0');
    expect(areaPath(points, 100)).toBe('M25 100 L75 0 L75 100 L25 100 Z');
    expect(areaPath([], 100)).toBe('');
  });
});
