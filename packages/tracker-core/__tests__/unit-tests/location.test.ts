import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LOCATION_MIN_MOVE_METRES,
  LOCATION_POLL_MS,
  LOCATION_DETAIL_MARK,
  LOCATION_UNAVAILABLE_MESSAGE,
  LocationPoller,
  TrackerLocationError,
  distanceMetres,
  isLocationUnavailable,
  readLocation,
  shouldSendPin,
} from '../../src/location';
import type { TrackerLocationInput } from '../../src/types';

/** Arbitrary test coordinates: a point, and the same point moved north by a given distance. */
const HOME = { lat: 12.9716, lng: 77.5946 };
const METRES_PER_DEGREE_LAT = 111_195;
const northOf = (metres: number) => ({
  lat: HOME.lat + metres / METRES_PER_DEGREE_LAT,
  lng: HOME.lng,
});

function fix(at: { lat: number; lng: number }): TrackerLocationInput {
  return { ...at, accuracyM: 15, source: 'GPS', capturedAt: '2026-02-03T09:00:00.000Z' };
}

describe('distanceMetres', () => {
  it('is zero between a point and itself', () => {
    expect(distanceMetres(HOME, HOME)).toBe(0);
  });

  it('measures a short move along a meridian to within a metre', () => {
    expect(distanceMetres(HOME, northOf(500))).toBeCloseTo(500, 0);
  });

  it('measures the same in either direction', () => {
    const away = { lat: 28.6139, lng: 77.209 };
    expect(distanceMetres(HOME, away)).toBeCloseTo(distanceMetres(away, HOME), 6);
  });

  it('stays finite for antipodal points (half the Earth’s circumference)', () => {
    const half = distanceMetres({ lat: 0, lng: 0 }, { lat: 0, lng: 180 });
    expect(half).toBeCloseTo(Math.PI * 6_371_000, 0);
  });
});

describe('shouldSendPin', () => {
  it('always sends the first pin of the day', () => {
    expect(shouldSendPin(null, HOME)).toBe(true);
  });

  it('holds back a fix closer than the minimum move', () => {
    expect(shouldSendPin(HOME, northOf(LOCATION_MIN_MOVE_METRES - 1))).toBe(false);
  });

  it('sends a fix at or beyond the minimum move', () => {
    expect(shouldSendPin(HOME, northOf(LOCATION_MIN_MOVE_METRES + 1))).toBe(true);
  });

  it('honours a custom threshold', () => {
    expect(shouldSendPin(HOME, northOf(60), 50)).toBe(true);
    expect(shouldSendPin(HOME, northOf(40), 50)).toBe(false);
  });
});

describe('readLocation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('answers the platform’s fix as it came', async () => {
    const at = fix(HOME);
    await expect(readLocation({ current: () => Promise.resolve(at) })).resolves.toBe(at);
  });

  it('turns any platform failure into the one explainable error, and logs the cause', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('permission denied');

    const read = readLocation({ current: () => Promise.reject(cause) });

    await expect(read).rejects.toBeInstanceOf(TrackerLocationError);
    await expect(read).rejects.toThrow(
      `${LOCATION_UNAVAILABLE_MESSAGE}${LOCATION_DETAIL_MARK}permission denied`,
    );
    expect(log).toHaveBeenCalledWith('Reading the device location failed', cause);
  });

  it('passes a platform’s own location error through with its reason', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new TrackerLocationError('Location permission denied');
    await expect(readLocation({ current: () => Promise.reject(cause) })).rejects.toBe(cause);
  });

  it('keeps only the marker when the platform rejects with something that is not an Error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const read = readLocation({ current: () => Promise.reject(new Error('')) });
    await expect(read).rejects.toThrow(LOCATION_UNAVAILABLE_MESSAGE);
    const bare = readLocation({ current: () => Promise.reject('nope') });
    await expect(bare).rejects.toHaveProperty('message', LOCATION_UNAVAILABLE_MESSAGE);
  });

  it('names its error so logs can tell it apart', () => {
    expect(new TrackerLocationError().name).toBe('TrackerLocationError');
  });
});

describe('LocationPoller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function poller(fixes: TrackerLocationInput[]) {
    const current = vi.fn(() => {
      const next = fixes.shift();
      return next === undefined ? Promise.reject(new Error('off')) : Promise.resolve(next);
    });
    const send = vi.fn(() => Promise.resolve(true));
    return { poller: new LocationPoller({ current }, send), current, send };
  }

  it('reads nothing until started, then once every poll interval', async () => {
    const rig = poller([fix(HOME), fix(northOf(1000))]);

    await vi.advanceTimersByTimeAsync(LOCATION_POLL_MS * 2);
    expect(rig.current).not.toHaveBeenCalled();

    rig.poller.start();
    await vi.advanceTimersByTimeAsync(LOCATION_POLL_MS - 1);
    expect(rig.current).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(rig.current).toHaveBeenCalledTimes(1);
    rig.poller.stop();
  });

  it('sends the first fix, skips a fix that has not moved, and sends one that has', async () => {
    const near = fix(northOf(50));
    const far = fix(northOf(LOCATION_MIN_MOVE_METRES + 50));
    const rig = poller([fix(HOME), near, far]);
    rig.poller.start();

    await vi.advanceTimersByTimeAsync(LOCATION_POLL_MS * 3);

    expect(rig.send.mock.calls).toEqual([[fix(HOME)], [far]]);
    rig.poller.stop();
  });

  it('measures the next move from a pin remembered from attendance', async () => {
    const rig = poller([fix(northOf(50))]);
    rig.poller.remember(HOME);
    rig.poller.start();

    await vi.advanceTimersByTimeAsync(LOCATION_POLL_MS);

    expect(rig.send).not.toHaveBeenCalled();
    rig.poller.stop();
  });

  it('logs a failed check and keeps polling', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const rig = poller([]);
    rig.poller.start();

    await vi.advanceTimersByTimeAsync(LOCATION_POLL_MS * 2);

    expect(rig.current).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith(
      'Recording a location failed',
      expect.any(TrackerLocationError),
    );
    expect(rig.send).not.toHaveBeenCalled();
    rig.poller.stop();
  });

  it('runs one timer however often it is started, and none once stopped', async () => {
    const rig = poller([fix(HOME), fix(HOME), fix(HOME)]);
    rig.poller.start();
    rig.poller.start();

    await vi.advanceTimersByTimeAsync(LOCATION_POLL_MS);
    expect(rig.current).toHaveBeenCalledTimes(1);

    rig.poller.stop();
    rig.poller.stop();
    await vi.advanceTimersByTimeAsync(LOCATION_POLL_MS * 2);
    expect(rig.current).toHaveBeenCalledTimes(1);
  });

  it('forgets the last pin on reset, so the next employee’s first fix is sent', async () => {
    const rig = poller([fix(HOME)]);
    rig.poller.remember(HOME);
    rig.poller.reset();
    rig.poller.start();

    await vi.advanceTimersByTimeAsync(LOCATION_POLL_MS);

    expect(rig.send).toHaveBeenCalledWith(fix(HOME));
    rig.poller.stop();
  });
});

describe('isLocationUnavailable', () => {
  it('recognises only the location sentence', () => {
    expect(isLocationUnavailable(LOCATION_UNAVAILABLE_MESSAGE)).toBe(true);
    expect(isLocationUnavailable(new TrackerLocationError('code 1').message)).toBe(true);
    expect(isLocationUnavailable('Network down.')).toBe(false);
    expect(isLocationUnavailable('')).toBe(false);
  });
});
