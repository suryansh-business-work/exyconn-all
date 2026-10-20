import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { TrackerEarnings, TrackerLocationPin } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { EarningsCard } from '../../../../src/components/dashboard/EarningsCard';
import { TodayLocations } from '../../../../src/components/dashboard/TodayLocations';
import { tracker } from '../../../../src/tracker/instance';
import { webViewTest } from '../../mocks/react-native-webview';
import { renderWithProviders } from '../../test-utils';
import { queryByA11yLabel } from '../state';

vi.mock('../../../../src/tracker/instance', () => ({
  tracker: { getLocations: vi.fn(), getEarnings: vi.fn() },
}));

/** Arbitrary test coordinates. */
const PINS: TrackerLocationPin[] = [
  {
    id: 'l1',
    kind: 'ATTENDANCE',
    lat: 12.97,
    lng: 77.59,
    accuracyM: 10,
    source: 'GPS',
    capturedAt: '2026-09-30T04:00:00.000Z',
  },
  {
    id: 'l2',
    kind: 'MOVE',
    lat: 12.99,
    lng: 77.61,
    accuracyM: 40.4,
    source: 'GPS',
    capturedAt: '2026-09-30T06:30:00.000Z',
  },
];

const locations = () => <TodayLocations timezone="UTC" attendanceMarked tracking={false} />;

describe('TodayLocations', () => {
  it('spins until the pins arrive, then lists each with when, why and from where', async () => {
    vi.mocked(tracker.getLocations).mockResolvedValue(PINS);
    renderWithProviders(locations());
    expect(screen.getByText('Today’s locations')).toBeInTheDocument();
    expect(queryByA11yLabel('Loading today’s locations')).not.toBeNull();

    expect(
      await screen.findByRole('button', { name: '4:00 AM, Attendance, GPS' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '6:30 AM, Moved, GPS' })).toBeInTheDocument();
    expect(screen.getByTestId('icon-account-check-outline')).toBeInTheDocument();
    expect(screen.getByTestId('icon-map-marker-outline')).toBeInTheDocument();
    expect(queryByA11yLabel('Loading today’s locations')).toBeNull();
  });

  it('says when nothing was recorded today', async () => {
    vi.mocked(tracker.getLocations).mockResolvedValue([]);
    renderWithProviders(locations());
    expect(await screen.findByText('No locations recorded today.')).toBeInTheDocument();
  });

  it('warns when the pins could not be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.getLocations).mockRejectedValue(new Error('offline'));
    renderWithProviders(locations());
    expect(await screen.findByText('Could not load today’s locations.')).toBeInTheDocument();
  });

  it('opens a pin on the map, view-only, and closes it', async () => {
    vi.mocked(tracker.getLocations).mockResolvedValue(PINS);
    renderWithProviders(locations());
    fireEvent.click(await screen.findByRole('button', { name: '6:30 AM, Moved, GPS' }));

    expect(screen.getByText('6:30 AM · Moved · GPS')).toBeInTheDocument();
    expect(screen.getByText('Accuracy about 40 m')).toBeInTheDocument();
    expect(webViewTest.last()?.source?.uri).toBe(
      'https://maps.google.com/maps?q=12.99,77.61&z=16&output=embed',
    );
    expect(screen.queryByRole('button', { name: 'Confirm & mark attendance' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('6:30 AM · Moved · GPS')).toBeNull());
  });
});

function earnings(overrides: Partial<TrackerEarnings> = {}): TrackerEarnings {
  return {
    payType: 'HOURLY',
    rate: 20,
    currency: 'USD',
    trackedMs: 5_400_000,
    amount: 30,
    ...overrides,
  };
}

describe('EarningsCard', () => {
  it('shows today’s and the month’s pay, with the hours and rate behind each', async () => {
    vi.mocked(tracker.getEarnings)
      .mockResolvedValueOnce(earnings())
      .mockResolvedValueOnce(earnings({ trackedMs: 36_000_000, amount: 200 }));
    renderWithProviders(<EarningsCard timezone="UTC" lastSyncAt={null} />);

    expect(await screen.findByText('Earnings')).toBeInTheDocument();
    expect(screen.getByText('Tracked hours × your hourly rate.')).toBeInTheDocument();
    expect(screen.getByText('$30.00')).toBeInTheDocument();
    expect(screen.getByText('1.5 h × $20.00 per hour')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getByText('10 h × $20.00 per hour')).toBeInTheDocument();
  });

  it('does not appear for pay that is not by the hour', async () => {
    vi.mocked(tracker.getEarnings).mockResolvedValue(earnings({ payType: 'FIXED', amount: null }));
    const { container } = renderWithProviders(<EarningsCard timezone="UTC" lastSyncAt={null} />);
    await waitFor(() => expect(tracker.getEarnings).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('Earnings')).toBeNull();
    expect(container.textContent).toBe('');
  });

  it('does not appear while loading, nor when the first read fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.getEarnings).mockRejectedValue(new Error('offline'));
    renderWithProviders(<EarningsCard timezone="UTC" lastSyncAt={null} />);
    expect(screen.queryByText('Earnings')).toBeNull();
    await waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(screen.queryByText('Could not load your earnings.')).toBeNull();
  });

  it('keeps the last figures and warns when a re-read fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.getEarnings)
      .mockResolvedValueOnce(earnings())
      .mockResolvedValueOnce(earnings({ amount: 200 }))
      .mockRejectedValue(new Error('offline'));
    const { rerender } = renderWithProviders(<EarningsCard timezone="UTC" lastSyncAt={null} />);
    await screen.findByText('$200.00');

    rerender(<EarningsCard timezone="UTC" lastSyncAt="2026-09-30T10:00:00.000Z" />);
    expect(await screen.findByText('Could not load your earnings.')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
  });
});
