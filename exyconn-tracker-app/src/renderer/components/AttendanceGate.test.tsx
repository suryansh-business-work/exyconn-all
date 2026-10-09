// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
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

describe('AttendanceGate', () => {
  it('says it is checking while the portal has not told it what today is', async () => {
    await mount(<AttendanceGate workday={null} />, state);
    expect(document.querySelector('[role="status"]')?.textContent).toBe(
      'Checking today’s attendance…',
    );
  });

  it('spins on Mark attendance and locks the fields until the portal answers', async () => {
    await mount(<AttendanceGate workday={unmarked} />, state);
    const marking = deferred();
    overrideTracker({ markAttendance: () => marking.promise });

    await press(buttonNamed('Mark attendance'));
    expect(isLoading(buttonNamed('Mark attendance'))).toBe(true);
    expect(document.querySelector<HTMLInputElement>('input:not([aria-hidden])')?.disabled).toBe(
      true,
    );

    await finish(marking.resolve);
    expect(isLoading(buttonNamed('Mark attendance'))).toBe(false);
  });

  it('shows why marking in failed', async () => {
    await mount(<AttendanceGate workday={unmarked} />, state);
    overrideTracker({ markAttendance: () => Promise.reject(new Error(NO_MESSAGE)) });

    await press(buttonNamed('Mark attendance'));
    await finish(() => undefined);
    expect(errorText()).toBe('Could not mark your attendance.');
  });

  it('reads back what was marked, with the note when there is one', async () => {
    const marked = { ...unmarked!, attendanceMarked: true, attendanceStatus: 'WFH' as const };
    await mount(<AttendanceGate workday={{ ...marked, attendanceNote: 'Dentist at 4' }} />, state);
    expect(document.body.textContent).toBe('Marked in today as Wfh — Dentist at 4.');
  });

  it('sends the status and the trimmed note that were chosen', async () => {
    await mount(<AttendanceGate workday={unmarked} />, state);
    const sent: unknown[] = [];
    overrideTracker({
      markAttendance: (...args: never[]) => Promise.resolve(sent.push(args)),
    });
    await choose('Attendance', 'Working from home');
    const note = [...document.querySelectorAll<HTMLInputElement>('input')].find(
      (input) => input.type === 'text' && !input.getAttribute('aria-hidden'),
    );
    await typeInto(note!, '  Dentist at 4  ');
    await press(buttonNamed('Mark attendance'));
    await finish(() => undefined);
    expect(sent).toEqual([['WFH', 'Dentist at 4']]);
  });

  it('reads back a mark with no note', async () => {
    await mount(<AttendanceGate workday={{ ...unmarked!, attendanceMarked: true }} />, state);
    expect(document.body.textContent).toBe('Marked in today as Present.');
  });
});
