// @vitest-environment jsdom
import { act, type ReactElement } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { TrackerLocationPin } from '@shared/types';
import TodayLocationsCard from '../../../../src/renderer/components/TodayLocationsCard';

import {
  button,
  clickElement,
  deferred,
  finish,
  installDomShims,
  installTracker,
  overrideTracker,
  render,
  rerender,
  settle,
  trackerState,
  unmountAll,
} from '../../test-utils';

beforeAll(installDomShims);
afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

const state = trackerState('idle');

/** Arbitrary test coordinates. */
const PINS: TrackerLocationPin[] = [
  {
    id: 'l1',
    kind: 'ATTENDANCE',
    lat: 12.97,
    lng: 77.59,
    accuracyM: 20,
    source: 'SYSTEM',
    capturedAt: '2026-09-14T04:00:00.000Z',
  },
  {
    id: 'l2',
    kind: 'MOVE',
    lat: 12.99,
    lng: 77.61,
    accuracyM: 35,
    source: 'SYSTEM',
    capturedAt: '2026-09-14T06:30:00.000Z',
  },
];

const card = (tracking = false, attendanceMarked = true) => (
  <TodayLocationsCard timezone="UTC" tracking={tracking} attendanceMarked={attendanceMarked} />
);

type Read = () => Promise<TrackerLocationPin[]>;

/** Renders against the fixture bridge, with `getLocations` answering as the test says. */
async function show(element: ReactElement, getLocations?: Read): Promise<void> {
  installTracker(state);
  if (getLocations !== undefined) {
    overrideTracker({ getLocations });
  }
  await render(element);
  await settle();
}

const text = (): string => document.body.textContent ?? '';

describe('TodayLocationsCard', () => {
  it('shows a loader until the pins arrive, then lists them oldest first', async () => {
    const reading = deferred<TrackerLocationPin[]>();
    await show(card(), () => reading.promise);

    expect(document.querySelector('[aria-label="Loading today’s locations"]')).not.toBeNull();
    await finish(() => reading.resolve(PINS));

    const rows = [...document.querySelectorAll('.MuiListItemButton-root')].map(
      (row) => row.textContent,
    );
    expect(rows).toEqual(['4:00 AM · Attendance · System', '6:30 AM · Moved · System']);
    expect(button('6:30 AM · Moved · System, show on map')).toBeDefined();
  });

  it('asks for today in the employee’s zone', async () => {
    const getLocations = vi.fn(() => Promise.resolve([]));
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-14T20:00:00.000Z'));
    await show(
      <TodayLocationsCard timezone="Asia/Kolkata" tracking={false} attendanceMarked />,
      getLocations,
    );
    vi.useRealTimers();

    expect(getLocations).toHaveBeenCalledWith('2026-09-15');
  });

  it('says when nothing was recorded today', async () => {
    await show(card());
    expect(text()).toContain('No locations recorded today.');
  });

  it('opens a pin on the map, view-only, and closes it', async () => {
    await show(card(), () => Promise.resolve(PINS));

    await clickElement(button('4:00 AM · Attendance · System, show on map'));
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('4:00 AM · Attendance · System');
    expect(dialog?.querySelector('iframe')?.getAttribute('src')).toContain('12.97,77.59');

    await clickElement(button('Close'));
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
  });

  it('warns when the pins could not be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await show(card(), () => Promise.reject(new Error('offline')));

    expect(document.querySelector('.MuiAlert-colorWarning')?.textContent).toBe(
      'Could not load today’s locations.',
    );
    expect(text()).toContain('No locations recorded today.');
  });

  it('re-reads on the move check’s beat while tracking, and not while idle', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const getLocations = vi.fn(() => Promise.resolve([]));
    await show(card(true), getLocations);
    expect(getLocations).toHaveBeenCalledTimes(1);

    await act(async () => vi.advanceTimersByTime(5 * 60_000));
    await settle();
    expect(getLocations).toHaveBeenCalledTimes(2);

    // Stopped: the beat stops with it.
    await rerender(card(false));
    await act(async () => vi.advanceTimersByTime(15 * 60_000));
    await settle();
    expect(getLocations).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('re-reads when attendance is marked, which sends the first pin', async () => {
    const getLocations = vi.fn(() => Promise.resolve([]));
    await show(card(false, false), getLocations);

    await rerender(card(false, true));
    await settle();
    expect(getLocations).toHaveBeenCalledTimes(2);
  });
});
