import { fireEvent, screen } from '@testing-library/react';
import { dayBounds, formatDayLabel, type DayDetail } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { DayDetailPanel } from '../../../../src/components/report/DayDetailPanel';
import { inputSummary } from '../../../../src/lib/report/totals';
import { galleryRoute } from '../../../../src/lib/screenshots/gallery-day';
import { renderWithProviders } from '../../test-utils';
import { router } from '../../mocks/expo-router';
import { getByA11yLabel, queryByA11yLabel } from '../state';
import { dayDetail, screenshot } from './fixtures';

vi.mock('../../../../src/components/charts/DayActivityChart', () => ({
  DayActivityChart: ({ title, timezone }: Readonly<{ title: string; timezone: string }>) => (
    <div data-testid="day-activity">{`${title} in ${timezone}`}</div>
  ),
}));

const DATE = new Date(2026, 1, 3);
const ZONE = 'Asia/Kolkata';
const SHOTS = [
  screenshot('shot-1', '2026-02-03T04:00:00.000Z'),
  screenshot('shot-2', '2026-02-03T05:00:00.000Z'),
];

type PanelProps = Partial<{
  detail: DayDetail | null;
  loading: boolean;
  error: string | null;
}>;

function renderPanel({ detail = dayDetail(), loading = false, error = null }: PanelProps = {}) {
  return renderWithProviders(
    <DayDetailPanel date={DATE} detail={detail} loading={loading} error={error} timezone={ZONE} />,
  );
}

describe('DayDetailPanel', () => {
  it('says why the day could not be shown, under its date', () => {
    renderPanel({ error: 'The portal could not be reached.' });

    expect(screen.getByText(formatDayLabel(DATE))).toBeInTheDocument();
    expect(screen.getByText('The portal could not be reached.')).toBeInTheDocument();
    expect(queryByA11yLabel('Loading this day')).toBeNull();
  });

  it('holds the day’s shape while it loads', () => {
    renderPanel({ loading: true });

    expect(getByA11yLabel('Loading this day')).toBeInTheDocument();
    expect(screen.queryByTestId('day-activity')).not.toBeInTheDocument();
  });

  it('keeps the skeleton until there is a day to show', () => {
    renderPanel({ detail: null });

    expect(getByA11yLabel('Loading this day')).toBeInTheDocument();
  });

  it('shows the day’s totals, input counts and activity chart in the employee’s zone', () => {
    const detail = dayDetail();
    renderPanel({ detail });

    expect(getByA11yLabel('Total worked: 6h 0m')).toBeInTheDocument();
    expect(screen.getByText(inputSummary(detail))).toBeInTheDocument();
    expect(screen.getByTestId('day-activity')).toHaveTextContent(`Activity in ${ZONE}`);
  });

  it('offers no gallery for a day without screenshots', () => {
    renderPanel();

    expect(screen.getByText('Screenshots (0)')).toBeInTheDocument();
    expect(screen.getByText('No screenshots on this day.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open gallery' })).not.toBeInTheDocument();
  });

  it('opens the gallery on the day as it runs in the employee’s zone', () => {
    renderPanel({ detail: dayDetail({ screenshots: SHOTS }) });

    expect(screen.getByText('Screenshots (2)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open gallery' }));

    expect(router.push).toHaveBeenCalledWith(galleryRoute(dayBounds(DATE, ZONE)));
  });

  it('opens the same gallery from a thumbnail', () => {
    renderPanel({ detail: dayDetail({ screenshots: SHOTS }) });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open my screenshots — this one was captured at 9:30 AM',
      }),
    );

    expect(router.push).toHaveBeenCalledWith(galleryRoute(dayBounds(DATE, ZONE)));
  });
});
