import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { Workday } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { ATTENDANCE_NOTE_MAX, AttendanceForm } from '../../../../src/forms/attendance';
import { tracker } from '../../../../src/tracker/instance';
import { renderWithProviders } from '../../test-utils';
import { typeInto } from '../field';
import { failingOn } from '../unexpected';

vi.mock('../../../../src/tracker/instance', () => ({ tracker: { markAttendance: vi.fn() } }));

const MARKED: Workday = {
  date: '2026-09-11',
  targetMs: 8 * 3_600_000,
  activeMs: 0,
  attendanceStatus: 'PRESENT',
  attendanceNote: null,
  attendanceMarked: true,
};

function markAttendance(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Mark attendance' }));
}

describe('AttendanceForm', () => {
  it('explains the gate, and marks the employee present by default with no note', async () => {
    vi.mocked(tracker.markAttendance).mockResolvedValue(MARKED);
    renderWithProviders(<AttendanceForm />);
    expect(
      screen.getByText('Mark your attendance for today before you start tracking.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `Anything HR should know about today — up to ${ATTENDANCE_NOTE_MAX} characters.`,
      ),
    ).toBeInTheDocument();
    markAttendance();
    await waitFor(() => expect(tracker.markAttendance).toHaveBeenCalledWith('PRESENT', null));
  });

  it('marks the status picked from the list, with the note trimmed', async () => {
    vi.mocked(tracker.markAttendance).mockResolvedValue(MARKED);
    renderWithProviders(<AttendanceForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Attendance: Present' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Working from home' }));
    expect(
      screen.getByRole('button', { name: 'Attendance: Working from home' }),
    ).toBeInTheDocument();
    typeInto('note', '  Dentist at 4  ');
    markAttendance();
    await waitFor(() => expect(tracker.markAttendance).toHaveBeenCalledWith('WFH', 'Dentist at 4'));
  });

  it("holds the note to the portal form's limit", async () => {
    renderWithProviders(<AttendanceForm />);
    typeInto('note', 'a'.repeat(ATTENDANCE_NOTE_MAX + 1));
    markAttendance();
    expect(
      await screen.findByText(`Keep the note under ${ATTENDANCE_NOTE_MAX} characters.`),
    ).toBeInTheDocument();
    expect(tracker.markAttendance).not.toHaveBeenCalled();
  });

  it("shows the portal's reason when attendance cannot be marked", async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('Attendance is already marked for today.');
    vi.mocked(tracker.markAttendance).mockRejectedValue(cause);
    renderWithProviders(<AttendanceForm />);
    markAttendance();
    expect(await screen.findByText('Attendance is already marked for today.')).toBeInTheDocument();
    expect(error).toHaveBeenCalledWith('Mark attendance failed', cause);
  });

  it('falls back to a plain sentence when the failure has no reason', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.markAttendance).mockRejectedValue(undefined);
    renderWithProviders(<AttendanceForm />);
    markAttendance();
    expect(await screen.findByText('Could not mark your attendance.')).toBeInTheDocument();
  });

  it('logs a failure it did not expect while handling a failure', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('Translations unavailable');
    vi.mocked(tracker.markAttendance).mockRejectedValue(new Error('offline'));
    renderWithProviders(<AttendanceForm />, {
      onMissing: failingOn('Could not mark your attendance.', failure),
    });
    markAttendance();
    await waitFor(() => expect(error).toHaveBeenCalledWith('Mark attendance failed', failure));
  });
});
