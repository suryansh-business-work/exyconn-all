import { screen } from '@testing-library/react';
import {
  ACTIVITY_LEGEND,
  dayStripes,
  formatTimeOfDay,
  type DayDetail,
  type DayInterval,
} from '@exyconn/tracker-core';
import { describe, expect, it } from 'vitest';
import { ActivityCard } from '../../../../src/components/charts/ActivityCard';
import { DayActivityChart } from '../../../../src/components/charts/DayActivityChart';
import { renderWithProviders } from '../../test-utils';
import { getByA11yLabel } from '../state';

const INTERVALS: DayInterval[] = [
  {
    startedAt: '2026-10-05T09:00:00.000Z',
    endedAt: '2026-10-05T10:00:00.000Z',
    activeMs: 45 * 60_000,
    idleMs: 15 * 60_000,
    activityPercent: 75,
  },
  {
    startedAt: '2026-10-05T11:00:00.000Z',
    endedAt: '2026-10-05T12:00:00.000Z',
    activeMs: 30 * 60_000,
    idleMs: 30 * 60_000,
    activityPercent: 50,
  },
];

function detail(intervals: DayInterval[]): DayDetail {
  return {
    activeMs: 75 * 60_000,
    idleMs: 45 * 60_000,
    keyCount: 0,
    mouseCount: 0,
    sessions: 1,
    screenshots: [],
    intervals,
  };
}

describe('ActivityCard', () => {
  it('heads the chart with its title, its percentage and the legend', () => {
    renderWithProviders(
      <ActivityCard title="Today’s activity" percent={64}>
        <span>chart</span>
      </ActivityCard>,
    );
    expect(screen.getByText('Today’s activity')).toBeInTheDocument();
    expect(screen.getByText('64%')).toBeInTheDocument();
    expect(screen.getByText('chart')).toBeInTheDocument();
    for (const entry of ACTIVITY_LEGEND) {
      expect(screen.getByText(entry.label)).toBeInTheDocument();
    }
  });

  it('hides the percentage while nothing has been tracked', () => {
    renderWithProviders(
      <ActivityCard title="Today’s activity" percent={null}>
        <span>chart</span>
      </ActivityCard>,
      { themeMode: 'dark' },
    );
    expect(screen.queryByText(/^\d+%$/)).toBeNull();
    expect(screen.getByText('Today’s activity')).toBeInTheDocument();
  });
});

describe('DayActivityChart', () => {
  it('shows a placeholder, not an empty message, while the first answer is loading', () => {
    const { container } = renderWithProviders(
      <DayActivityChart title="Today" detail={null} loading timezone="UTC" />,
    );
    expect(screen.queryByText('Nothing has synced for this day yet.')).toBeNull();
    expect(container.querySelectorAll('rect')).toHaveLength(0);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('says so when nothing has synced for the day', () => {
    renderWithProviders(
      <DayActivityChart title="Today" detail={detail([])} loading={false} timezone="UTC" />,
    );
    expect(screen.getByText('Nothing has synced for this day yet.')).toBeInTheDocument();
  });

  it('draws each synced interval, labelled in the employee’s zone', () => {
    const zone = 'Asia/Kolkata';
    const { container } = renderWithProviders(
      <DayActivityChart title="Today" detail={detail(INTERVALS)} loading={false} timezone={zone} />,
    );
    const shaped = dayStripes(INTERVALS);
    const span = shaped.span ?? { startISO: '', midISO: '', endISO: '' };
    const start = formatTimeOfDay(span.startISO, zone);
    const end = formatTimeOfDay(span.endISO, zone);

    expect(container.querySelectorAll('rect')).toHaveLength(2);
    expect(screen.getByText(start)).toBeInTheDocument();
    expect(screen.getByText(formatTimeOfDay(span.midISO, zone))).toBeInTheDocument();
    expect(screen.getByText(end)).toBeInTheDocument();
    expect(screen.getByText(`${shaped.averagePercent}%`)).toBeInTheDocument();
    expect(
      getByA11yLabel(
        `2 intervals from ${start} to ${end}, ${shaped.averagePercent}% active overall.`,
      ),
    ).toBeInTheDocument();
  });

  it('keeps the chart, not a placeholder, when a re-read is in flight', () => {
    const { container } = renderWithProviders(
      <DayActivityChart title="Today" detail={detail(INTERVALS)} loading timezone="UTC" />,
    );
    expect(container.querySelectorAll('rect')).toHaveLength(2);
  });
});
