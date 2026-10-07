import { describe, expect, it } from 'vitest';
import {
  linePoints,
  slotCenters,
  stackedColumns,
  stackedMax,
  type PlotArea,
} from '../../../../src/lib/report/chart-geometry';
import { isChartEmpty, type ChartData } from '../../../../src/lib/report/charts';

const PLOT: PlotArea = { left: 0, top: 0, width: 100, height: 100 };

/** A series shorter than its labels — a day the portal sent for one series only. */
const RAGGED: ChartData = {
  labels: ['01', '02'],
  series: [
    { id: 'active', label: 'Worked', values: [4] },
    { id: 'idle', label: 'Idle', values: [1, 2] },
  ],
};

describe('ragged and empty charts', () => {
  it('reads a missing value as zero when stacking', () => {
    expect(stackedMax(RAGGED)).toBe(5);
    const [, second] = stackedColumns(RAGGED, 10, PLOT);
    expect(second.segments).toEqual([{ seriesId: 'idle', y: 80, height: 20 }]);
  });

  it('draws no columns and no slots for a chart without labels', () => {
    expect(stackedColumns({ labels: [], series: [] }, 10, PLOT)).toEqual([]);
    expect(slotCenters(0, PLOT)).toEqual([]);
  });

  it('lays every point on the baseline when the axis has no height', () => {
    expect(linePoints([3, 7], 0, PLOT)).toEqual([
      { x: 25, y: 100 },
      { x: 75, y: 100 },
    ]);
  });

  it('calls a chart with days but no series empty', () => {
    expect(isChartEmpty({ labels: ['01'], series: [] })).toBe(true);
  });
});
