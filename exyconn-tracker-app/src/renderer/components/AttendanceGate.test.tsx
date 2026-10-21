// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { TrackerLocationInput } from '@shared/types';
import { TrackerLocationError } from '@exyconn/tracker-core';
import AttendanceGate from './AttendanceGate';
import { trackerState } from '../a11y/tracker-fixture';
import { cleanup, installDomShims, mount } from '../a11y/render-harness';
import {
  buttonNamed,
  deferred,
  errorText,
  finish,
  isLoading,
  overrideTracker,
  choose,
  press,
  typeInto,
} from '../a11y/component-harness';

beforeAll(installDomShims);
afterEach(cleanup);

const state = trackerState('idle');
const unmarked = state.workday;

/** An error that carries no text, so the screen has to fall back to its own words. */
const NO_MESSAGE = '';

const FIX: TrackerLocationInput = {
  lat: 12.97,
  lng: 77.59,
  accuracyM: 24.6,
  source: 'SYSTEM',
  capturedAt: '2026-09-14T04:00:00.000Z',
};

/** Chromium's words when this app is refused location — the reason the dialog shows. */
const DENIED = 'Geolocation failed (code 1): User denied Geolocation';

/** A made-up address on the employee's record. */
const ADDRESS = '12 Example Road, Testville';

/** No fix, as it crosses IPC: Electron's wrapper round the controller's location error. */
const locationFails = (): Promise<TrackerLocationInput> =>
  Promise.reject(
    new Error(
      `Error invoking remote method 'x': TrackerLocationError: ${new TrackerLocationError(DENIED).message}`,
    ),
  );

/** The location dialog, while it is open. */
const dialog = (): HTMLElement | null => document.querySelector('[role="dialog"]');

/** Waits out the dialog's exit transition. */
const closed = (): Promise<void> => vi.waitFor(() => expect(dialog()).toBeNull());

describe('AttendanceGate', () => {
  it('says it is checking while the portal has not told it what today is', async () => {
    await mount(<AttendanceGate workday={null} />, state);
    expect(document.querySelector('[role="status"]')?.textContent).toBe(
      'Checking today’s attendance…',
    );
  });

  it('spins on Mark attendance and locks the fields while the location is read', async () => {
    await mount(<AttendanceGate workday={unmarked} />, state);
    const locating = deferred<TrackerLocationInput>();
    overrideTracker({ getLocation: () => locating.promise });

    await press(buttonNamed('Mark attendance'));
    expect(isLoading(buttonNamed('Mark attendance'))).toBe(true);
    expect(document.querySelector<HTMLInputElement>('input:not([aria-hidden])')?.disabled).toBe(
      true,
    );
    expect(dialog()).toBeNull();

    await finish(() => locating.resolve(FIX));
    expect(isLoading(buttonNamed('Mark attendance'))).toBe(false);
    expect(dialog()?.querySelector('h2')?.textContent).toBe('Your location');
    expect(dialog()?.querySelector('iframe')?.getAttribute('src')).toContain('12.97,77.59');
    expect(dialog()?.textContent).toContain('Accuracy about 25 m');
  });

  it('shows why the location could not be read, and marks nothing', async () => {
    await mount(<AttendanceGate workday={unmarked} />, state);
    const markAttendance = vi.fn();
    overrideTracker({
      getLocation: () => Promise.reject(new Error(NO_MESSAGE)),
      markAttendance,
    });

    await press(buttonNamed('Mark attendance'));
    await finish(() => undefined);
    expect(errorText()).toBe('Could not read your location.');
    expect(dialog()).toBeNull();
    expect(markAttendance).not.toHaveBeenCalled();
  });

  it('offers no settings page for a failure that is not about location access', async () => {
    await mount(<AttendanceGate workday={unmarked} />, state);
    overrideTracker({ getLocation: () => Promise.reject(new Error('Network down.')) });

    await press(buttonNamed('Mark attendance'));
    await finish(() => undefined);
    expect(errorText()).toBe('Network down.');
    expect(document.querySelector('.MuiAlert-action')).toBeNull();
  });

  it('explains a location failure in a dialog, with the platform’s reason and the settings page', async () => {
    await mount(<AttendanceGate workday={unmarked} />, state);
    const openLocationSettings = vi.fn(() => Promise.resolve());
    const markAttendance = vi.fn();
    overrideTracker({ getLocation: locationFails, openLocationSettings, markAttendance });

    await press(buttonNamed('Mark attendance'));
    await finish(() => undefined);
    expect(dialog()?.querySelector('h2')?.textContent).toBe('Your location could not be read');
    expect(dialog()?.textContent).toContain('The tracker is not allowed to use your location.');
    expect(dialog()?.textContent).toContain(`Details: ${DENIED}`);
    // The reason is in the dialog only — not again under the form behind it.
    expect(errorText()).toBeUndefined();
    await press(buttonNamed('Open location settings'));
    expect(openLocationSettings).toHaveBeenCalledTimes(1);
    expect(markAttendance).not.toHaveBeenCalled();
  });

  it('marks in at the profile address when the location cannot be read', async () => {
    await mount(<AttendanceGate workday={{ ...unmarked!, profileAddress: ADDRESS }} />, state);
    const marking = deferred();
    const markAttendance = vi.fn(() => marking.promise);
    overrideTracker({ getLocation: locationFails, markAttendance });
    await press(buttonNamed('Mark attendance'));
    await finish(() => undefined);
    expect(dialog()?.textContent).toContain(ADDRESS);

    await press(buttonNamed('Mark in at my profile address'));
    expect(isLoading(buttonNamed('Mark in at my profile address'))).toBe(true);
    expect(buttonNamed('Mark in without location').disabled).toBe(true);
    expect(markAttendance).toHaveBeenCalledWith('PRESENT', null, 'PROFILE_ADDRESS');

    await finish(marking.resolve);
    await closed();
  });

  it('offers no profile address when HR has not added one, but still marks in without location', async () => {
    await mount(<AttendanceGate workday={unmarked} />, state);
    const markAttendance = vi.fn(() => Promise.resolve());
    overrideTracker({ getLocation: locationFails, markAttendance });
    await press(buttonNamed('Mark attendance'));
    await finish(() => undefined);

    expect(buttonNamed('Mark in at my profile address').disabled).toBe(true);
    expect(dialog()?.textContent).toContain('There is no address on your employee record.');
    await press(buttonNamed('Mark in without location'));
    await finish(() => undefined);
    expect(markAttendance).toHaveBeenCalledWith('PRESENT', null, 'NONE');
    await closed();
  });

  it('keeps the fallback dialog open with the portal’s reason when the mark is refused', async () => {
    await mount(<AttendanceGate workday={unmarked} />, state);
    overrideTracker({
      getLocation: locationFails,
      markAttendance: () => Promise.reject(new Error('Your tracker access has been revoked.')),
    });
    await press(buttonNamed('Mark attendance'));
    await finish(() => undefined);
    await press(buttonNamed('Mark in without location'));
    await finish(() => undefined);

    expect(dialog()?.querySelector('.MuiAlert-colorError')?.textContent).toBe(
      'Your tracker access has been revoked.',
    );
    await press(buttonNamed('Cancel'));
    await finish(() => undefined);
    await closed();
    expect(errorText()).toBeUndefined();
  });

  it('reads the location again on Try again, and shows the map once it is read', async () => {
    await mount(<AttendanceGate workday={unmarked} />, state);
    const getLocation = vi
      .fn<() => Promise<TrackerLocationInput>>()
      .mockImplementationOnce(locationFails)
      .mockResolvedValue(FIX);
    overrideTracker({ getLocation });
    await press(buttonNamed('Mark attendance'));
    await finish(() => undefined);

    await press(buttonNamed('Try again'));
    await finish(() => undefined);
    // The map opens while the fallback dialog may still be fading out.
    await vi.waitFor(() =>
      expect(
        [...document.querySelectorAll('[role="dialog"] h2')].map((title) => title.textContent),
      ).toContain('Your location'),
    );
    expect(getLocation).toHaveBeenCalledTimes(2);
  });

  it('spins on confirm until the portal answers, then closes the map', async () => {
    await mount(<AttendanceGate workday={unmarked} />, state);
    const marking = deferred();
    overrideTracker({
      getLocation: () => Promise.resolve(FIX),
      markAttendance: () => marking.promise,
    });
    await press(buttonNamed('Mark attendance'));
    await finish(() => undefined);

    await press(buttonNamed('Confirm & mark attendance'));
    expect(isLoading(buttonNamed('Confirm & mark attendance'))).toBe(true);
    expect(buttonNamed('Cancel').disabled).toBe(true);

    await finish(marking.resolve);
    await closed();
  });

  it('keeps the map open with the reason when marking failed, and Cancel clears it', async () => {
    await mount(<AttendanceGate workday={unmarked} />, state);
    overrideTracker({
      getLocation: () => Promise.resolve(FIX),
      markAttendance: () => Promise.reject(new Error(NO_MESSAGE)),
    });
    await press(buttonNamed('Mark attendance'));
    await finish(() => undefined);
    await press(buttonNamed('Confirm & mark attendance'));
    await finish(() => undefined);

    expect(dialog()?.querySelector('.MuiAlert-colorError')?.textContent).toBe(
      'Could not mark your attendance.',
    );
    // Shown once, in the dialog — not again under the form behind it.
    expect(document.querySelectorAll('.MuiAlert-colorError')).toHaveLength(1);

    await press(buttonNamed('Cancel'));
    await finish(() => undefined);
    await closed();
    expect(errorText()).toBeUndefined();
  });

  it('reads back what was marked, with the note when there is one', async () => {
    const marked = { ...unmarked!, attendanceMarked: true, attendanceStatus: 'WFH' as const };
    await mount(<AttendanceGate workday={{ ...marked, attendanceNote: 'Dentist at 4' }} />, state);
    expect(document.body.textContent).toBe('Marked in today as Wfh — Dentist at 4.');
  });

  it('sends the status, the trimmed note and the very pin that was previewed', async () => {
    await mount(<AttendanceGate workday={unmarked} />, state);
    const sent: unknown[] = [];
    const getLocation = vi.fn(() => Promise.resolve(FIX));
    overrideTracker({
      getLocation,
      markAttendance: (...args: never[]) => Promise.resolve(sent.push(args)),
    });
    await choose('Attendance', 'Working from home');
    const note = [...document.querySelectorAll<HTMLInputElement>('input')].find(
      (input) => input.type === 'text' && !input.getAttribute('aria-hidden'),
    );
    await typeInto(note!, '  Dentist at 4  ');
    await press(buttonNamed('Mark attendance'));
    await finish(() => undefined);
    await press(buttonNamed('Confirm & mark attendance'));
    await finish(() => undefined);
    expect(sent).toEqual([['WFH', 'Dentist at 4', FIX]]);
    expect(getLocation).toHaveBeenCalledTimes(1);
  });

  it('sends no note when only spaces were typed', async () => {
    await mount(<AttendanceGate workday={unmarked} />, state);
    const sent: unknown[] = [];
    overrideTracker({
      getLocation: () => Promise.resolve(FIX),
      markAttendance: (...args: never[]) => Promise.resolve(sent.push(args)),
    });
    const note = [...document.querySelectorAll<HTMLInputElement>('input')].find(
      (input) => input.type === 'text' && !input.getAttribute('aria-hidden'),
    );
    await typeInto(note!, '   ');
    await press(buttonNamed('Mark attendance'));
    await finish(() => undefined);
    await press(buttonNamed('Confirm & mark attendance'));
    await finish(() => undefined);
    expect(sent).toEqual([['PRESENT', null, FIX]]);
  });

  it('reads back a mark with no note', async () => {
    await mount(<AttendanceGate workday={{ ...unmarked!, attendanceMarked: true }} />, state);
    expect(document.body.textContent).toBe('Marked in today as Present.');
  });
});
