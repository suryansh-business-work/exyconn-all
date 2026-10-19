import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOCATION_POLL_MS, TrackerLocationError } from '../../src/location';
import { TrackerOffDayError } from '../../src/off-day';
import type { TrackerEarnings, TrackerLocationPin } from '../../src/types';
import { LOCATION, WORKDAY, me } from './controller-data';
import { signedIn } from './controller-fixture';

const POLL = 60_000;
const HOLIDAY = { ...WORKDAY, offReason: 'HOLIDAY' as const, offLabel: 'Holi' };

/** The same fix moved about a kilometre north — far enough to be a new pin. */
const MOVED = { ...LOCATION, lat: LOCATION.lat + 0.009 };

describe('TrackerController location', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T10:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('reads the fix for the employee to confirm, without sending it', async () => {
    const setup = await signedIn();

    await expect(setup.controller.readLocation()).resolves.toEqual(LOCATION);
    expect(setup.portal.recordLocation).not.toHaveBeenCalled();
    expect(setup.portal.markAttendance).not.toHaveBeenCalled();
  });

  it('explains a fix that cannot be read', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const setup = await signedIn();
    vi.mocked(setup.deps.location.current).mockRejectedValue(new Error('denied'));

    await expect(setup.controller.readLocation()).rejects.toBeInstanceOf(TrackerLocationError);
  });

  it('pins a move every poll while tracking, and only while tracking', async () => {
    const setup = await signedIn();
    const current = vi.mocked(setup.deps.location.current);
    current.mockResolvedValue(MOVED);

    await vi.advanceTimersByTimeAsync(LOCATION_POLL_MS);
    expect(current).not.toHaveBeenCalled();

    await setup.controller.start();
    await vi.advanceTimersByTimeAsync(LOCATION_POLL_MS);
    expect(setup.portal.recordLocation).toHaveBeenCalledWith(MOVED);

    setup.controller.pause();
    const reads = current.mock.calls.length;
    await vi.advanceTimersByTimeAsync(LOCATION_POLL_MS);
    expect(current).toHaveBeenCalledTimes(reads);

    setup.controller.resume();
    await vi.advanceTimersByTimeAsync(LOCATION_POLL_MS);
    expect(current).toHaveBeenCalledTimes(reads + 1);

    await setup.controller.stop();
    await vi.advanceTimersByTimeAsync(LOCATION_POLL_MS);
    expect(current).toHaveBeenCalledTimes(reads + 1);
  });

  it('measures the first move from the confirmed attendance pin', async () => {
    const setup = await signedIn({ workday: { ...WORKDAY, attendanceMarked: false } });
    await setup.controller.markAttendance('PRESENT', null, LOCATION);
    await setup.controller.start();

    // Still where attendance was marked: nothing new to pin.
    await vi.advanceTimersByTimeAsync(LOCATION_POLL_MS);
    expect(setup.portal.recordLocation).not.toHaveBeenCalled();

    vi.mocked(setup.deps.location.current).mockResolvedValue(MOVED);
    await vi.advanceTimersByTimeAsync(LOCATION_POLL_MS);
    expect(setup.portal.recordLocation).toHaveBeenCalledWith(MOVED);
    await setup.controller.stop();
  });

  it('stops polling on sign-out', async () => {
    const setup = await signedIn();
    await setup.controller.start();
    await setup.controller.logout();
    const current = vi.mocked(setup.deps.location.current);
    const reads = current.mock.calls.length;

    await vi.advanceTimersByTimeAsync(LOCATION_POLL_MS * 2);

    expect(current).toHaveBeenCalledTimes(reads);
  });
});

describe('TrackerController off days', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T10:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('refuses to mark attendance on an off day, sending nothing', async () => {
    const setup = await signedIn({ workday: { ...HOLIDAY, attendanceMarked: false } });

    const marking = setup.controller.markAttendance('PRESENT', null, LOCATION);

    await expect(marking).rejects.toBeInstanceOf(TrackerOffDayError);
    await expect(marking).rejects.toMatchObject({
      workday: { offReason: 'HOLIDAY', offLabel: 'Holi' },
    });
    expect(setup.portal.markAttendance).not.toHaveBeenCalled();
  });

  it('refuses to start on an off day even with attendance marked', async () => {
    const setup = await signedIn({ workday: HOLIDAY });

    await expect(setup.controller.start()).rejects.toBeInstanceOf(TrackerOffDayError);
    expect(setup.platform.deps.portal.startSession).not.toHaveBeenCalled();
    expect(setup.latest().status).toBe('idle');
  });

  it('stops a running session when the heartbeat says today turned into an off day', async () => {
    const setup = await signedIn();
    await setup.controller.start();
    vi.mocked(setup.portal.heartbeat).mockResolvedValue(me({ workday: HOLIDAY }));

    await vi.advanceTimersByTimeAsync(POLL);

    expect(setup.latest().status).toBe('idle');
    expect(setup.platform.deps.portal.stopSession).toHaveBeenCalledTimes(1);
  });

  it('stops a paused session on an off day too', async () => {
    const setup = await signedIn();
    await setup.controller.start();
    setup.controller.pause();
    vi.mocked(setup.portal.heartbeat).mockResolvedValue(me({ workday: HOLIDAY }));

    await vi.advanceTimersByTimeAsync(POLL);

    expect(setup.latest().status).toBe('idle');
  });

  it('leaves a running session alone on a working day', async () => {
    const setup = await signedIn();
    await setup.controller.start();

    await vi.advanceTimersByTimeAsync(POLL);

    expect(setup.latest().status).toBe('tracking');
    await setup.controller.stop();
  });
});

describe('TrackerController month and location reads', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T10:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('asks for the contract and its report in the employee’s zone', async () => {
    const setup = await signedIn({ timezone: 'Asia/Kolkata' });
    const file = { fileName: 'hours.xlsx', mimeType: 'application/x', contentBase64: 'UEs=' };
    vi.mocked(setup.portal.fetchMyExpectedReport).mockResolvedValue(file);

    await expect(setup.controller.getExpected('a', 'b')).resolves.toEqual({
      workHoursPerDay: 8,
      days: [],
    });
    await expect(setup.controller.getExpectedReport('a', 'b')).resolves.toBe(file);
    expect(setup.portal.fetchMyExpected).toHaveBeenCalledWith('a', 'b', 'Asia/Kolkata');
    expect(setup.portal.fetchMyExpectedReport).toHaveBeenCalledWith('a', 'b', 'Asia/Kolkata');
  });

  it('hands the day’s pins and the earnings straight through', async () => {
    const setup = await signedIn();
    const pins: TrackerLocationPin[] = [{ ...LOCATION, id: 'l1', kind: 'ATTENDANCE' }];
    const earnings: TrackerEarnings = {
      payType: 'HOURLY',
      rate: 20,
      currency: 'USD',
      trackedMs: 3_600_000,
      amount: 20,
    };
    vi.mocked(setup.portal.fetchMyLocations).mockResolvedValue(pins);
    vi.mocked(setup.portal.fetchMyEarnings).mockResolvedValue(earnings);

    await expect(setup.controller.getLocations('2026-02-03')).resolves.toBe(pins);
    await expect(setup.controller.getEarnings('a', 'b')).resolves.toBe(earnings);
    expect(setup.portal.fetchMyLocations).toHaveBeenCalledWith('2026-02-03');
    expect(setup.portal.fetchMyEarnings).toHaveBeenCalledWith('a', 'b');
  });
});
