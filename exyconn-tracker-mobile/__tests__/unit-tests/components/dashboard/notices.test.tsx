import { act, screen } from '@testing-library/react';
import { autoStopNotice, type Workday } from '@exyconn/tracker-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AttendanceGate } from '../../../../src/components/dashboard/AttendanceGate';
import { AutoStopNotice } from '../../../../src/components/dashboard/AutoStopNotice';
import { CapabilityNotice } from '../../../../src/components/dashboard/CapabilityNotice';
import { SectionHeading } from '../../../../src/components/dashboard/SectionHeading';
import { StatusChip } from '../../../../src/components/dashboard/StatusChip';
import { renderWithProviders } from '../../test-utils';
import { t } from '../../translator';
import { settings } from '../../dashboard/fixtures';
import { ANDROID_CAPABILITIES, IOS_CAPABILITIES, getByA11yLabel } from '../state';

const platform = vi.hoisted(() => ({ capabilities: { background: true } }));

vi.mock('../../../../src/tracker/platform', () => platform);
vi.mock('../../../../src/forms/attendance', () => ({
  AttendanceForm: () => <div data-testid="attendance-form" />,
}));

function workday(overrides: Partial<Workday> = {}): Workday {
  return {
    date: '2026-10-07',
    targetMs: 8 * 3_600_000,
    activeMs: 0,
    attendanceStatus: null,
    attendanceNote: null,
    attendanceMarked: false,
    ...overrides,
  };
}

beforeEach(() => {
  Object.assign(platform.capabilities, ANDROID_CAPABILITIES);
});

describe('SectionHeading', () => {
  it('says what the block is and whether its numbers reset', () => {
    renderWithProviders(<SectionHeading title="All time" caption="It never resets." />);
    expect(screen.getByText('All time')).toBeInTheDocument();
    expect(screen.getByText('It never resets.')).toBeInTheDocument();
  });
});

describe('StatusChip', () => {
  it.each([
    ['tracking', 'Tracking…'],
    ['paused', 'Paused'],
    ['idle', 'Not tracking'],
    ['signed-out', 'Signed out'],
    ['consent-required', 'Consent required'],
  ] as const)('labels %s as "%s" and speaks it as the status', (status, label) => {
    renderWithProviders(<StatusChip status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(getByA11yLabel(`Status: ${label}`)).toBeInTheDocument();
  });
});

describe('CapabilityNotice', () => {
  it('says nothing on a phone that tracks in the background', () => {
    renderWithProviders(<CapabilityNotice />);
    expect(screen.queryByText(/iPhone/)).toBeNull();
  });

  it('tells an iPhone user that only open-app time counts', () => {
    Object.assign(platform.capabilities, IOS_CAPABILITIES);
    renderWithProviders(<CapabilityNotice />);
    expect(
      screen.getByText('iPhone records your time only while the tracker is open.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/claim anything else as off-computer time/)).toBeInTheDocument();
  });
});

describe('AttendanceGate', () => {
  it('shows a loader until the portal has said what today is', () => {
    renderWithProviders(<AttendanceGate workday={null} />);
    expect(screen.getByText('Checking today’s attendance…')).toBeInTheDocument();
    expect(screen.queryByTestId('attendance-form')).toBeNull();
  });

  it('asks the employee to mark in when they have not', () => {
    renderWithProviders(<AttendanceGate workday={workday()} />);
    expect(screen.getByTestId('attendance-form')).toBeInTheDocument();
  });

  it('confirms the attendance already marked, with its status', () => {
    renderWithProviders(
      <AttendanceGate workday={workday({ attendanceMarked: true, attendanceStatus: 'WFH' })} />,
    );
    expect(screen.getByText('Marked in today as Wfh.')).toBeInTheDocument();
  });

  it('adds the employee’s note to the confirmation', () => {
    renderWithProviders(
      <AttendanceGate
        workday={workday({
          attendanceMarked: true,
          attendanceStatus: 'HALF_DAY',
          attendanceNote: 'dentist at 4',
        })}
      />,
    );
    expect(screen.getByText('Marked in today as Half day — dentist at 4.')).toBeInTheDocument();
  });

  it('reads a marked day with no status as present', () => {
    renderWithProviders(<AttendanceGate workday={workday({ attendanceMarked: true })} />);
    expect(screen.getByText('Marked in today as Present.')).toBeInTheDocument();
  });
});

describe('AutoStopNotice', () => {
  const scheduled = settings({ autoStartEnabled: true, autoStartHour: 9, autoStopHour: 18 });

  it('renders nothing when the workspace runs no schedule', () => {
    renderWithProviders(<AutoStopNotice settings={settings()} timezone="UTC" status="tracking" />);
    expect(screen.queryByText(/Tracking/)).toBeNull();
  });

  it('renders nothing before the settings have loaded', () => {
    renderWithProviders(<AutoStopNotice settings={null} timezone="UTC" status="idle" />);
    expect(screen.queryByText(/Tracking/)).toBeNull();
  });

  it('warns outside the tracking hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-07T07:00:00.000Z'));
    const expected = autoStopNotice(t, scheduled, 'UTC', 'idle', new Date());
    renderWithProviders(<AutoStopNotice settings={scheduled} timezone="UTC" status="idle" />);
    expect(expected?.severity).toBe('warning');
    expect(screen.getByText(expected?.title ?? '')).toBeInTheDocument();
    expect(screen.getByText(expected?.detail ?? '')).toBeInTheDocument();
  });

  it('counts down on its own as the stop hour approaches', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-07T12:00:00.000Z'));
    renderWithProviders(<AutoStopNotice settings={scheduled} timezone="UTC" status="tracking" />);
    const before = autoStopNotice(t, scheduled, 'UTC', 'tracking', new Date());
    expect(screen.getByText(before?.title ?? '')).toBeInTheDocument();

    vi.setSystemTime(new Date('2026-10-07T17:50:00.000Z'));
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    const after = autoStopNotice(t, scheduled, 'UTC', 'tracking', new Date());
    expect(after?.title).not.toBe(before?.title);
    expect(screen.getByText(after?.title ?? '')).toBeInTheDocument();
  });
});
