import { screen } from '@testing-library/react';
import { zonedToday, type DayDetail, type TrackerTotals } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { SyncBar } from '../../../../src/components/dashboard/SyncBar';
import { TodayActivity } from '../../../../src/components/dashboard/TodayActivity';
import { TotalsPanel } from '../../../../src/components/dashboard/TotalsPanel';
import { useMyDay } from '../../../../src/hooks/useMyDay';
import { useTotals } from '../../../../src/hooks/useTotals';
import { totalTiles } from '../../../../src/lib/dashboard/total-tiles';
import { renderWithProviders } from '../../test-utils';
import { settings, stats } from '../../dashboard/fixtures';
import { ANDROID_CAPABILITIES, queryByA11yLabel } from '../state';

vi.mock('../../../../src/hooks/useTotals', () => ({ useTotals: vi.fn() }));
vi.mock('../../../../src/hooks/useMyDay', () => ({ useMyDay: vi.fn() }));
vi.mock('../../../../src/tracker/platform', async () => ({
  capabilities: (await import('../state')).ANDROID_CAPABILITIES,
}));

const TOTALS: TrackerTotals = {
  activeMs: 7_200_000,
  idleMs: 1_800_000,
  screenshots: 9,
  sessions: 3,
};

describe('SyncBar', () => {
  it('shows a spinner and no verdict while an upload is in flight', () => {
    renderWithProviders(
      <SyncBar
        stats={stats({ syncing: true, lastSyncOutcome: { kind: 'nothing' } })}
        settings={settings()}
        timezone="UTC"
      />,
    );
    expect(screen.getByText('Uploading…')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText(/Nothing to upload/)).toBeNull();
  });

  it('says everything is uploaded, on the workspace’s cadence', () => {
    renderWithProviders(<SyncBar stats={stats()} settings={settings()} timezone="UTC" />);
    expect(screen.getByText('Everything uploaded')).toBeInTheDocument();
    expect(screen.getByTestId('icon-cloud-check-outline')).toBeInTheDocument();
    expect(
      screen.getByText('Last synced Never · Uploads automatically every 5 minutes'),
    ).toBeInTheDocument();
  });

  it('counts what is still queued', () => {
    renderWithProviders(
      <SyncBar stats={stats({ pendingSync: 3 })} settings={null} timezone="UTC" />,
    );
    expect(screen.getByText('3 waiting to upload')).toBeInTheDocument();
    expect(screen.getByTestId('icon-cloud-upload-outline')).toBeInTheDocument();
    expect(screen.getByText('Last synced Never · Sync policy unavailable')).toBeInTheDocument();
  });

  it('says what the last sync did', () => {
    renderWithProviders(
      <SyncBar
        stats={stats({ lastSyncOutcome: { kind: 'failed', reason: 'The portal is unreachable.' } })}
        settings={settings()}
        timezone="UTC"
      />,
    );
    expect(screen.getByText('The portal is unreachable.')).toBeInTheDocument();
  });
});

describe('TotalsPanel', () => {
  it('re-reads the all-time totals whenever a sync lands', () => {
    vi.mocked(useTotals).mockReturnValue({ totals: null, loading: true, error: null });
    renderWithProviders(<TotalsPanel lastSyncAt="2026-10-07T09:00:00.000Z" />);
    expect(useTotals).toHaveBeenCalledWith('2026-10-07T09:00:00.000Z');
  });

  it('holds the grid’s shape with placeholders while loading', () => {
    vi.mocked(useTotals).mockReturnValue({ totals: null, loading: true, error: null });
    renderWithProviders(<TotalsPanel lastSyncAt={null} />);
    expect(screen.getByText('All time')).toBeInTheDocument();
    expect(queryByA11yLabel('Loading your all-time totals')).not.toBeNull();
  });

  it('shows the portal’s totals as tiles', () => {
    vi.mocked(useTotals).mockReturnValue({ totals: TOTALS, loading: false, error: null });
    renderWithProviders(<TotalsPanel lastSyncAt={null} />);
    for (const tile of totalTiles(TOTALS, ANDROID_CAPABILITIES)) {
      expect(screen.getByText(tile.label)).toBeInTheDocument();
    }
    expect(queryByA11yLabel('Loading your all-time totals')).toBeNull();
  });

  it('says so when the totals could not be read, without a placeholder', () => {
    vi.mocked(useTotals).mockReturnValue({
      totals: null,
      loading: true,
      error: 'Could not load your all-time totals.',
    });
    renderWithProviders(<TotalsPanel lastSyncAt={null} />);
    expect(screen.getByText('Could not load your all-time totals.')).toBeInTheDocument();
    expect(queryByA11yLabel('Loading your all-time totals')).toBeNull();
  });
});

describe('TodayActivity', () => {
  const day: DayDetail = {
    activeMs: 0,
    idleMs: 0,
    keyCount: 0,
    mouseCount: 0,
    sessions: 0,
    screenshots: [],
    intervals: [],
  };

  function query(detail: DayDetail | null, loading: boolean) {
    return { detail, loading, refreshing: false, error: null, reload: vi.fn() };
  }

  it('reads today in the employee’s zone, again after every sync', () => {
    vi.mocked(useMyDay).mockReturnValue(query(day, false));
    renderWithProviders(<TodayActivity timezone="Asia/Tokyo" lastSyncAt="sync-1" />);
    expect(useMyDay).toHaveBeenCalledWith(zonedToday('Asia/Tokyo'), 'Asia/Tokyo', 'sync-1');
    expect(screen.getByText('Today’s activity')).toBeInTheDocument();
    expect(screen.getByText('Nothing has synced for this day yet.')).toBeInTheDocument();
  });

  it('shows a placeholder only until the first answer', () => {
    vi.mocked(useMyDay).mockReturnValue(query(null, true));
    renderWithProviders(<TodayActivity timezone="UTC" lastSyncAt={null} />);
    expect(screen.queryByText('Nothing has synced for this day yet.')).toBeNull();
  });

  it('keeps the last answer up while a re-read is in flight', () => {
    vi.mocked(useMyDay).mockReturnValue(query(day, true));
    renderWithProviders(<TodayActivity timezone="UTC" lastSyncAt={null} />);
    expect(screen.getByText('Nothing has synced for this day yet.')).toBeInTheDocument();
  });
});
