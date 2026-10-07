import { describe, expect, it } from 'vitest';
import { activityPercent, formatDuration } from '@/pages/tracker-view/tracker.format';
import { dayByHourChart, projectSplitChart } from '@/pages/tracker-view/tracker.charts';

describe('formatDuration', () => {
  it('shows minutes alone under an hour', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(59_999)).toBe('0m');
    expect(formatDuration(45 * 60_000)).toBe('45m');
  });

  it('shows hours and minutes from an hour up', () => {
    expect(formatDuration(3_600_000)).toBe('1h 0m');
    expect(formatDuration(5_400_000)).toBe('1h 30m');
    expect(formatDuration(25 * 3_600_000 + 61_000)).toBe('25h 1m');
  });
});

describe('activityPercent', () => {
  it('is zero when nothing was tracked', () => {
    expect(activityPercent(0, 0)).toBe(0);
  });

  it('rounds the active share to a whole percentage', () => {
    expect(activityPercent(1, 2)).toBe(33);
    expect(activityPercent(2, 1)).toBe(67);
    expect(activityPercent(5, 0)).toBe(100);
    expect(activityPercent(0, 5)).toBe(0);
  });
});

describe('tracker charts without a day loaded', () => {
  it('draws nothing by the hour', () => {
    expect(dayByHourChart(undefined, 'UTC')).toEqual({ labels: [], series: [] });
  });

  it('has no projects to split', () => {
    expect(projectSplitChart(undefined)).toEqual({
      labels: [],
      series: [{ id: 'project-time', label: 'Worked', values: [] }],
    });
  });
});
