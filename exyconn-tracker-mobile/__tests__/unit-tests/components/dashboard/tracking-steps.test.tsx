import { screen, within } from '@testing-library/react';
import type { Workday } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { TrackingSteps } from '../../../../src/components/dashboard/TrackingSteps';
import { renderWithProviders } from '../../test-utils';
import { propsOf } from '../../app/stub';
import { trackerState } from '../state';

vi.mock('../../../../src/forms/presence', async () => ({
  PresenceForm: (await import('../../app/stub')).stub('presence-form'),
}));
vi.mock('../../../../src/components/dashboard/AttendanceGate', async () => ({
  AttendanceGate: (await import('../../app/stub')).stub('attendance-gate'),
}));
vi.mock('../../../../src/components/dashboard/ProjectPicker', async () => ({
  ProjectPicker: (await import('../../app/stub')).stub('project-picker'),
}));
vi.mock('../../../../src/components/dashboard/TicketPicker', async () => ({
  TicketPicker: (await import('../../app/stub')).stub('ticket-picker'),
}));

const UNMARKED: Workday = {
  date: '2026-10-21',
  targetMs: 8 * 3_600_000,
  activeMs: 0,
  attendanceStatus: null,
  attendanceNote: null,
  attendanceMarked: false,
  offReason: null,
  offLabel: null,
  profileAddress: null,
};
const MARKED: Workday = { ...UNMARKED, attendanceStatus: 'PRESENT', attendanceMarked: true };

describe('TrackingSteps', () => {
  it('numbers attendance, project and status, locking the last two until attendance', () => {
    renderWithProviders(
      <TrackingSteps state={trackerState({ workday: UNMARKED })} offDay={null} />,
    );

    const attendance = screen.getByText('Mark attendance & location');
    const project = screen.getByText('Project');
    const status = screen.getByText('My status');
    expect(
      attendance.compareDocumentPosition(project) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(project.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getAllByText('Mark your attendance first.')).toHaveLength(2);
    expect(propsOf(screen.getByTestId('attendance-gate'))).toEqual({ workday: UNMARKED });
    expect(screen.queryByTestId('icon-check')).toBeNull();
  });

  it('ticks the done steps and opens the rest once attendance is marked', () => {
    renderWithProviders(
      <TrackingSteps
        state={trackerState({ workday: MARKED, selectedProjectId: 'p1', status: 'tracking' })}
        offDay={null}
      />,
    );

    // Attendance and project are complete; status shows the employee's presence.
    expect(screen.getAllByTestId('icon-check')).toHaveLength(2);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Working')).toBeInTheDocument();
    expect(screen.queryByText('Mark your attendance first.')).toBeNull();
    // The booking cannot change mid-session.
    expect(propsOf(screen.getByTestId('project-picker'))).toMatchObject({
      selectedProjectId: 'p1',
      disabled: true,
      loading: false,
    });
    expect(propsOf(screen.getByTestId('ticket-picker'))).toMatchObject({ disabled: true });
  });

  it('shows the off-day sentence in place of attendance, gating nothing', () => {
    renderWithProviders(
      <TrackingSteps state={trackerState({ workday: null })} offDay="Today is a holiday." />,
    );

    expect(screen.queryByTestId('attendance-gate')).toBeNull();
    expect(screen.getByText('Today is a holiday.')).toBeInTheDocument();
    expect(screen.queryByText('Mark your attendance first.')).toBeNull();
    expect(propsOf(screen.getByTestId('project-picker'))).toMatchObject({
      disabled: false,
      loading: true,
    });
    expect(within(document.body).getByTestId('presence-form')).toBeInTheDocument();
  });
});
