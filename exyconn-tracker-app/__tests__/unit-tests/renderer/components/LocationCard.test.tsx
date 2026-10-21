// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { TrackerLocationInput } from '@shared/types';
import { LOCATION_PURPOSE } from '@exyconn/tracker-core';
import LocationCard from '../../../../src/renderer/components/LocationCard';
import {
  buttonNamed,
  deferred,
  finish,
  installDomShims,
  installTracker,
  isLoading,
  overrideTracker,
  pressButton,
  render,
  settle,
  trackerState,
  unmountAll,
} from '../../test-utils';

beforeAll(installDomShims);
afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

/** Arbitrary test coordinates. */
const FIX: TrackerLocationInput = {
  lat: 12.97,
  lng: 77.59,
  accuracyM: 20,
  source: 'SYSTEM',
  capturedAt: '2026-09-14T04:00:00.000Z',
};

const statusLine = (): string | undefined =>
  document.querySelector('[role="status"]')?.textContent ?? undefined;
const chip = (): string | undefined =>
  document.querySelector('.MuiChip-label')?.textContent ?? undefined;

async function show(getLocation: () => Promise<TrackerLocationInput>): Promise<void> {
  installTracker(trackerState('idle'));
  overrideTracker({ getLocation });
  await render(<LocationCard />);
}

describe('LocationCard', () => {
  it('says why location is needed, and that it is checking until a fix comes back', async () => {
    const locating = deferred<TrackerLocationInput>();
    await show(() => locating.promise);

    expect(document.body.textContent).toContain(LOCATION_PURPOSE);
    expect(chip()).toBe('Checking…');
    expect(statusLine()).toBe('Checking whether the tracker can read your location…');
    expect(isLoading(buttonNamed('Check again'))).toBe(true);

    await finish(() => locating.resolve(FIX));
    expect(chip()).toBe('On');
    expect(statusLine()).toBe('The tracker can read where you are.');
    expect(isLoading(buttonNamed('Check again'))).toBe(false);
  });

  it('reports location off, and logs why, when no fix can be read', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('denied');
    await show(() => Promise.reject(cause));
    await settle();

    expect(chip()).toBe('Off');
    expect(statusLine()).toMatch(/^No location could be read\./);
    expect(logged).toHaveBeenCalledWith('Checking location access failed', cause);
  });

  it('reads a fix again on Check again, after the setting was changed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const getLocation = vi
      .fn<() => Promise<TrackerLocationInput>>()
      .mockRejectedValueOnce(new Error('off'))
      .mockResolvedValueOnce(FIX);
    await show(getLocation);
    await settle();
    expect(chip()).toBe('Off');

    await pressButton(buttonNamed('Check again'));
    await settle();
    expect(getLocation).toHaveBeenCalledTimes(2);
    expect(chip()).toBe('On');
  });

  it('opens the OS location settings, logging a page that would not open', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('no settings page');
    const openLocationSettings = vi.fn(() => Promise.reject(failure));
    await show(() => Promise.resolve(FIX));
    overrideTracker({ openLocationSettings });

    await pressButton(buttonNamed('Open location settings'));
    await settle();
    expect(openLocationSettings).toHaveBeenCalledTimes(1);
    expect(logged).toHaveBeenCalledWith('Tracker action failed', failure);
  });
});
