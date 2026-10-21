// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { TrackerLocationInput } from '@shared/types';
import { LOCATION_UNAVAILABLE_MESSAGE } from '@exyconn/tracker-core';
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

  it('offers the OS location settings when location access is off', async () => {
    await mount(<AttendanceGate workday={unmarked} />, state);
    const openLocationSettings = vi.fn(() => Promise.resolve());
    overrideTracker({
      // As it crosses IPC: Electron's wrapper round the controller's sentence.
      getLocation: () =>
        Promise.reject(
          new Error(`Error invoking remote method 'x': Error: ${LOCATION_UNAVAILABLE_MESSAGE}`),
        ),
      openLocationSettings,
    });

    await press(buttonNamed('Mark attendance'));
    await finish(() => undefined);
    expect(errorText()).toContain(LOCATION_UNAVAILABLE_MESSAGE);
    await press(buttonNamed('Open location settings'));
    expect(openLocationSettings).toHaveBeenCalledTimes(1);
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
