import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  TrackerLocationError,
  type TrackerLocationInput,
  type Workday,
} from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { ATTENDANCE_NOTE_MAX, AttendanceForm } from '../../../../src/forms/attendance';
import { tracker } from '../../../../src/tracker/instance';
import { webViewTest } from '../../mocks/react-native-webview';
import { Linking } from '../../mocks/react-native/apis';
import { renderWithProviders } from '../../test-utils';
import { typeInto } from '../field';
import { failingOn } from '../unexpected';

vi.mock('../../../../src/tracker/instance', () => ({
  tracker: { markAttendance: vi.fn(), readLocation: vi.fn() },
}));

const MARKED: Workday = {
  date: '2026-09-11',
  targetMs: 8 * 3_600_000,
  activeMs: 0,
  attendanceStatus: 'PRESENT',
  attendanceNote: null,
  attendanceMarked: true,
  offReason: null,
  offLabel: null,
  profileAddress: null,
};

const TODAY: Workday = { ...MARKED, attendanceStatus: null, attendanceMarked: false };

/** Arbitrary test coordinates. */
const PIN: TrackerLocationInput = {
  lat: 12.97,
  lng: 77.59,
  accuracyM: 8.6,
  source: 'GPS',
  capturedAt: '2026-09-11T04:00:00.000Z',
};

const CONFIRM = 'Confirm & mark attendance';
const PROFILE_ADDRESS = 'Mark in at my profile address';
const WITHOUT_LOCATION = 'Mark in without location';

/** expo-location's refusal, as the phone's provider words it. */
const DENIED = 'Location permission denied';

/** A made-up address on the employee's record. */
const ADDRESS = '12 Example Road, Testville';

function markAttendance(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Mark attendance' }));
}

/** Presses Mark attendance and waits for the map sheet to show the fix. */
async function locate(): Promise<void> {
  markAttendance();
  await screen.findByRole('button', { name: CONFIRM });
}

function confirm(): void {
  fireEvent.click(screen.getByRole('button', { name: CONFIRM }));
}

describe('AttendanceForm', () => {
  it('explains the gate, then shows the fix on a map before marking anything', async () => {
    vi.mocked(tracker.readLocation).mockResolvedValue(PIN);
    renderWithProviders(<AttendanceForm workday={TODAY} />);
    expect(
      screen.getByText('Mark your attendance for today before you start tracking.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `Anything HR should know about today — up to ${ATTENDANCE_NOTE_MAX} characters.`,
      ),
    ).toBeInTheDocument();

    await locate();

    expect(webViewTest.last()?.source?.uri).toBe(
      'https://maps.google.com/maps?q=12.97,77.59&z=16&output=embed',
    );
    expect(screen.getByText('Accuracy about 9 m')).toBeInTheDocument();
    expect(tracker.markAttendance).not.toHaveBeenCalled();
  });

  it('marks the employee present by default, with no note, at the very pin shown', async () => {
    vi.mocked(tracker.readLocation).mockResolvedValue(PIN);
    vi.mocked(tracker.markAttendance).mockResolvedValue(MARKED);
    renderWithProviders(<AttendanceForm workday={TODAY} />);
    await locate();
    confirm();
    await waitFor(() => expect(tracker.markAttendance).toHaveBeenCalledWith('PRESENT', null, PIN));
    await waitFor(() => expect(screen.queryByRole('button', { name: CONFIRM })).toBeNull());
    expect(tracker.readLocation).toHaveBeenCalledTimes(1);
  });

  it('marks the status picked from the list, with the note trimmed', async () => {
    vi.mocked(tracker.readLocation).mockResolvedValue(PIN);
    vi.mocked(tracker.markAttendance).mockResolvedValue(MARKED);
    renderWithProviders(<AttendanceForm workday={TODAY} />);
    fireEvent.click(screen.getByRole('button', { name: 'Attendance: Present' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Working from home' }));
    expect(
      screen.getByRole('button', { name: 'Attendance: Working from home' }),
    ).toBeInTheDocument();
    typeInto('note', '  Dentist at 4  ');
    await locate();
    confirm();
    await waitFor(() =>
      expect(tracker.markAttendance).toHaveBeenCalledWith('WFH', 'Dentist at 4', PIN),
    );
  });

  it("holds the note to the portal form's limit, before reading any location", async () => {
    renderWithProviders(<AttendanceForm workday={TODAY} />);
    typeInto('note', 'a'.repeat(ATTENDANCE_NOTE_MAX + 1));
    markAttendance();
    expect(
      await screen.findByText(`Keep the note under ${ATTENDANCE_NOTE_MAX} characters.`),
    ).toBeInTheDocument();
    expect(tracker.readLocation).not.toHaveBeenCalled();
    expect(tracker.markAttendance).not.toHaveBeenCalled();
  });

  it('explains why no location could be read, with the platform’s reason and its settings', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new TrackerLocationError(DENIED);
    vi.mocked(tracker.readLocation).mockRejectedValue(cause);
    renderWithProviders(<AttendanceForm workday={TODAY} />);
    markAttendance();
    expect(await screen.findByText('Your location could not be read')).toBeInTheDocument();
    expect(
      screen.getByText(/The tracker is not allowed to use your location\./),
    ).toBeInTheDocument();
    expect(screen.getByText(`Details: ${DENIED}`)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: CONFIRM })).toBeNull();
    expect(error).toHaveBeenCalledWith('Reading the location for attendance failed', cause);

    fireEvent.click(screen.getByRole('button', { name: 'Open location settings' }));
    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
    expect(tracker.markAttendance).not.toHaveBeenCalled();
  });

  it('marks in at the profile address when no location can be read', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.readLocation).mockRejectedValue(new TrackerLocationError(DENIED));
    vi.mocked(tracker.markAttendance).mockResolvedValue(MARKED);
    renderWithProviders(<AttendanceForm workday={{ ...TODAY, profileAddress: ADDRESS }} />);
    markAttendance();
    expect(await screen.findByText(ADDRESS)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: PROFILE_ADDRESS }));
    await waitFor(() =>
      expect(tracker.markAttendance).toHaveBeenCalledWith('PRESENT', null, 'PROFILE_ADDRESS'),
    );
    await waitFor(() => expect(screen.queryByText(ADDRESS)).toBeNull());
  });

  it('offers no profile address when HR has none, and marks in without location', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.readLocation).mockRejectedValue(new TrackerLocationError(DENIED));
    vi.mocked(tracker.markAttendance).mockResolvedValue(MARKED);
    renderWithProviders(<AttendanceForm workday={TODAY} />);
    markAttendance();
    expect(
      await screen.findByText('There is no address on your employee record. Ask HR to add one.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: PROFILE_ADDRESS })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: WITHOUT_LOCATION }));
    await waitFor(() =>
      expect(tracker.markAttendance).toHaveBeenCalledWith('PRESENT', null, 'NONE'),
    );
  });

  it('keeps the sheet open with the portal’s reason when the fallback is refused', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.readLocation).mockRejectedValue(new TrackerLocationError(DENIED));
    vi.mocked(tracker.markAttendance).mockRejectedValue(
      new Error('Your tracker access has been revoked.'),
    );
    renderWithProviders(<AttendanceForm workday={TODAY} />);
    markAttendance();
    fireEvent.click(await screen.findByRole('button', { name: WITHOUT_LOCATION }));
    expect(await screen.findByText('Your tracker access has been revoked.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByText('Your location could not be read')).toBeNull());
  });

  it('reads again on Try again, and shows a failure that is not about location under the form', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.readLocation)
      .mockRejectedValueOnce(new TrackerLocationError(DENIED))
      .mockRejectedValueOnce(new Error('GPS timed out.'));
    renderWithProviders(<AttendanceForm workday={TODAY} />);
    markAttendance();
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('GPS timed out.')).toBeInTheDocument();
    expect(screen.queryByText('Your location could not be read')).toBeNull();
    expect(tracker.readLocation).toHaveBeenCalledTimes(2);
  });

  it('falls back to a plain sentence when locating fails with no reason', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.readLocation).mockRejectedValue(undefined);
    renderWithProviders(<AttendanceForm workday={TODAY} />);
    markAttendance();
    expect(await screen.findByText('Could not read your location.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open location settings' })).toBeNull();
  });

  it("keeps the map open with the portal's reason when attendance cannot be marked", async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('Attendance is already marked for today.');
    vi.mocked(tracker.readLocation).mockResolvedValue(PIN);
    vi.mocked(tracker.markAttendance).mockRejectedValue(cause);
    renderWithProviders(<AttendanceForm workday={TODAY} />);
    await locate();
    confirm();
    expect(await screen.findByText('Attendance is already marked for today.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: CONFIRM })).toBeInTheDocument();
    expect(error).toHaveBeenCalledWith('Mark attendance failed', cause);
  });

  it('words a refusal on an off day the way the off-day banner does', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.readLocation).mockResolvedValue(PIN);
    vi.mocked(tracker.markAttendance).mockRejectedValue(
      new Error('Today is an off day — tracking is paused.'),
    );
    const holiday = { ...TODAY, offReason: 'HOLIDAY' as const, offLabel: 'Onam' };
    renderWithProviders(<AttendanceForm workday={holiday} />);
    await locate();
    confirm();
    expect(
      await screen.findByText('Today is a holiday (Onam) — tracking is paused.'),
    ).toBeInTheDocument();
  });

  it('falls back to a plain sentence when marking fails with no reason', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.readLocation).mockResolvedValue(PIN);
    vi.mocked(tracker.markAttendance).mockRejectedValue(undefined);
    renderWithProviders(<AttendanceForm workday={TODAY} />);
    await locate();
    confirm();
    expect(await screen.findByText('Could not mark your attendance.')).toBeInTheDocument();
  });

  it('backs out on Cancel without marking', async () => {
    vi.mocked(tracker.readLocation).mockResolvedValue(PIN);
    renderWithProviders(<AttendanceForm workday={TODAY} />);
    await locate();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: CONFIRM })).toBeNull());
    expect(tracker.markAttendance).not.toHaveBeenCalled();
  });

  it('logs a failure it did not expect while handling a failed mark', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('Translations unavailable');
    vi.mocked(tracker.readLocation).mockResolvedValue(PIN);
    vi.mocked(tracker.markAttendance).mockRejectedValue(new Error('offline'));
    renderWithProviders(<AttendanceForm workday={TODAY} />, {
      onMissing: failingOn('Could not mark your attendance.', failure),
    });
    await locate();
    confirm();
    await waitFor(() => expect(error).toHaveBeenCalledWith('Mark attendance failed', failure));
  });

  it('logs a failure it did not expect while handling a failed locate', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('Translations unavailable');
    vi.mocked(tracker.readLocation).mockRejectedValue(new Error('denied'));
    renderWithProviders(<AttendanceForm workday={TODAY} />, {
      onMissing: failingOn('Could not read your location.', failure),
    });
    markAttendance();
    await waitFor(() => expect(error).toHaveBeenCalledWith('Mark attendance failed', failure));
  });
});
