import { describe, expect, it } from 'vitest';
import { dashboardStats } from '../../../src/dashboard/dashboard-stats';

const formatNumber = (value: number) => `n${value}`;

describe('dashboardStats', () => {
  it('writes all eight figures, each explaining how it is counted', () => {
    const stats = dashboardStats(
      {
        totalMeetings: 12,
        meetingsThisMonth: 4,
        totalDurationSeconds: 5400,
        notesGenerated: 10,
        pendingActions: 6,
        completedActions: 9,
        overdueActions: 2,
        transcriptionFailures: 1,
        byDay: [],
      },
      formatNumber,
    );
    expect(stats.map((stat) => [stat.label, stat.value])).toEqual([
      ['Total Meetings', 'n12'],
      ['Meetings This Month', 'n4'],
      ['Total Meeting Duration', '1h 30m'],
      ['AI Notes Generated', 'n10'],
      ['Pending Actions', 'n6'],
      ['Completed Actions', 'n9'],
      ['Overdue Actions', 'n2'],
      ['Transcription Failures', 'n1'],
    ]);
    expect(stats.every((stat) => Boolean(stat.info))).toBe(true);
  });

  it('shows zeros, not blanks, before the figures arrive', () => {
    expect(dashboardStats(undefined, formatNumber).map((stat) => stat.value)).toEqual([
      'n0',
      'n0',
      '0m',
      'n0',
      'n0',
      'n0',
      'n0',
      'n0',
    ]);
  });
});
