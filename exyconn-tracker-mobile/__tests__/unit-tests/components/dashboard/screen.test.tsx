import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardScreen } from '../../../../src/components/dashboard/DashboardScreen';
import { TrackerCard } from '../../../../src/components/dashboard/TrackerCard';
import { sessionTiles } from '../../../../src/lib/dashboard/session-tiles';
import { renderWithProviders } from '../../test-utils';
import { propsOf } from '../../app/stub';
import { settings, stats } from '../../dashboard/fixtures';
import { ANDROID_CAPABILITIES, trackerState } from '../state';

vi.mock('../../../../src/tracker/instance', () => ({
  tracker: { setProject: vi.fn(), setTask: vi.fn(), start: vi.fn() },
  resumeTracking: vi.fn(),
}));
vi.mock('../../../../src/tracker/platform', async () => ({
  capabilities: (await import('../state')).ANDROID_CAPABILITIES,
}));
vi.mock('../../../../src/forms/presence', async () => ({
  PresenceForm: (await import('../../app/stub')).stub('presence-form'),
}));
vi.mock('../../../../src/forms/attendance', async () => ({
  AttendanceForm: (await import('../../app/stub')).stub('attendance-form'),
}));
vi.mock('../../../../src/components/dashboard/DayProgress', async () => ({
  DayProgress: (await import('../../app/stub')).stub('day-progress'),
}));
vi.mock('../../../../src/components/dashboard/TodayActivity', async () => ({
  TodayActivity: (await import('../../app/stub')).stub('today-activity'),
}));
vi.mock('../../../../src/components/dashboard/SyncBar', async () => ({
  SyncBar: (await import('../../app/stub')).stub('sync-bar'),
}));
vi.mock('../../../../src/components/dashboard/TotalsPanel', async () => ({
  TotalsPanel: (await import('../../app/stub')).stub('totals-panel'),
}));

const WORKDAY = {
  date: '2026-10-07',
  targetMs: 8 * 3_600_000,
  activeMs: 0,
  attendanceStatus: 'PRESENT' as const,
  attendanceNote: null,
  attendanceMarked: true,
};

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('DashboardScreen', () => {
  const state = trackerState({
    status: 'tracking',
    stats: stats({ dayActiveMs: 3_600_000, lastSyncAt: '2026-10-07T08:00:00.000Z' }),
    settings: settings(),
    workday: WORKDAY,
    timezone: 'Europe/London',
    preferences: { ...trackerState().preferences, progressStyle: 'ring' },
  });

  it('leads with the day’s progress, in the employee’s chosen shape', () => {
    renderWithProviders(<DashboardScreen state={state} />);
    expect(propsOf(screen.getByTestId('day-progress'))).toEqual({
      workday: WORKDAY,
      workProfile: null,
      activeMs: 3_600_000,
      style: 'ring',
    });
  });

  it('feeds today’s chart, the sync bar and the totals the last sync', () => {
    renderWithProviders(<DashboardScreen state={state} />);
    expect(propsOf(screen.getByTestId('today-activity'))).toEqual({
      timezone: 'Europe/London',
      lastSyncAt: '2026-10-07T08:00:00.000Z',
    });
    expect(propsOf(screen.getByTestId('sync-bar'))).toEqual({
      stats: state.stats,
      settings: state.settings,
      timezone: 'Europe/London',
    });
    expect(propsOf(screen.getByTestId('totals-panel'))).toEqual({
      lastSyncAt: '2026-10-07T08:00:00.000Z',
    });
  });

  it('keeps this session’s live counters in their own labelled block', () => {
    renderWithProviders(<DashboardScreen state={state} />);
    expect(screen.getByText('This session')).toBeInTheDocument();
    expect(
      screen.getByText('Live counters for the run in progress — they reset to zero when you stop.'),
    ).toBeInTheDocument();
    for (const tile of sessionTiles(state.stats, state.settings, ANDROID_CAPABILITIES)) {
      expect(screen.getByText(tile.label)).toBeInTheDocument();
    }
  });

  it('shows the tracker card with who is signed in', () => {
    renderWithProviders(<DashboardScreen state={state} />);
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
  });
});

describe('TrackerCard', () => {
  it('names who is signed in and what the tracker is doing', () => {
    renderWithProviders(<TrackerCard state={trackerState({ workday: WORKDAY })} />);
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('asha@example.test')).toBeInTheDocument();
    expect(screen.getByText('Not tracking')).toBeInTheDocument();
    expect(screen.getByText('Marked in today as Present.')).toBeInTheDocument();
  });

  it('falls back to a plain "Signed in" before the profile has loaded', () => {
    renderWithProviders(<TrackerCard state={trackerState({ user: null })} />);
    expect(screen.getByText('Signed in')).toBeInTheDocument();
  });

  it('enables Start only once attendance is marked', () => {
    const { unmount } = renderWithProviders(
      <TrackerCard state={trackerState({ workday: null })} />,
    );
    expect(screen.getByRole('button', { name: 'Start' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Checking today’s attendance…')).toBeInTheDocument();
    unmount();

    renderWithProviders(<TrackerCard state={trackerState({ workday: WORKDAY })} />);
    expect(screen.getByRole('button', { name: 'Start' })).not.toHaveAttribute('aria-disabled');
  });

  it('shows the project as loading until the portal has said what today is', () => {
    renderWithProviders(<TrackerCard state={trackerState({ workday: null })} />);
    expect(screen.getByText('Loading projects…')).toBeInTheDocument();
  });

  it('locks the project and ticket while a session runs', () => {
    renderWithProviders(
      <TrackerCard
        state={trackerState({
          status: 'paused',
          workday: WORKDAY,
          projects: [{ id: 'p1', name: 'Global Project', key: 'GLB' }],
          selectedProjectId: 'p1',
        })}
      />,
    );
    expect(screen.getByRole('button', { name: 'Project: Global Project' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Ticket: No ticket' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('puts the presence control above the buttons, in the employee’s zone', () => {
    const state = trackerState({ timezone: 'Asia/Dubai' });
    renderWithProviders(<TrackerCard state={state} />);
    expect(propsOf(screen.getByTestId('presence-form'))).toEqual({
      presence: state.presence,
      timezone: 'Asia/Dubai',
    });
  });
});
