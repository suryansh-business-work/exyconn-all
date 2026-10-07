import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WORKDAY, me } from './controller-data';
import { rig, signedIn } from './controller-fixture';

describe('TrackerController tracking controls', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T10:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ignores start while signed out', async () => {
    const setup = rig();

    await setup.controller.start();

    expect(setup.deps.createEngine).not.toHaveBeenCalled();
    expect(setup.controller.getState().status).toBe('signed-out');
  });

  it('ignores start while consent is still owed', async () => {
    const setup = await signedIn({ consentRequired: true });

    await setup.controller.start();

    expect(setup.platform.deps.portal.startSession).not.toHaveBeenCalled();
    expect(setup.latest().status).toBe('consent-required');
  });

  it('refuses to start before attendance is marked, saying what to do', async () => {
    const setup = await signedIn({ workday: { ...WORKDAY, attendanceMarked: false } });

    await expect(setup.controller.start()).rejects.toThrow(
      'Mark your attendance for today before tracking can start.',
    );
    expect(setup.platform.deps.portal.startSession).not.toHaveBeenCalled();
  });

  it('starts against the chosen project and ticket', async () => {
    const setup = await signedIn();
    vi.mocked(setup.portal.fetchTasks).mockResolvedValue([
      { id: 't1', key: 'WEB-1', title: 'Fix header', assignedToMe: true },
    ]);
    setup.controller.setProject('p2');
    await vi.advanceTimersByTimeAsync(0);
    setup.controller.setTask('t1');

    await setup.controller.start();

    expect(setup.platform.deps.portal.startSession).toHaveBeenCalledWith(
      '2026-02-03T10:00:00.000Z',
      'p2',
      't1',
    );
    expect(setup.latest().status).toBe('tracking');
    await setup.controller.stop();
  });

  it('pauses, resumes and stops through the engine', async () => {
    const setup = await signedIn();
    await setup.controller.start();

    setup.controller.pause();
    expect(setup.latest().status).toBe('paused');
    expect(setup.platform.deps.input.stop).toHaveBeenCalledTimes(1);
    setup.controller.resume();
    expect(setup.latest().status).toBe('tracking');
    await setup.controller.stop();

    expect(setup.latest().status).toBe('idle');
    expect(setup.platform.deps.portal.stopSession).toHaveBeenCalledTimes(1);
  });

  it('uploads on demand through the engine', async () => {
    const setup = await signedIn();
    await setup.controller.start();
    await vi.advanceTimersByTimeAsync(2000);

    await setup.controller.syncNow();

    expect(setup.platform.deps.portal.syncIntervals).toHaveBeenCalledTimes(1);
    await setup.controller.stop();
  });

  it('leaves a signed-out status alone when stop is pressed', async () => {
    const setup = rig();

    await setup.controller.stop();

    expect(setup.latest().status).toBe('signed-out');
  });
});

describe('TrackerController workday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T10:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('adopts the attendance the portal recorded and unlocks tracking', async () => {
    const setup = await signedIn({ workday: { ...WORKDAY, attendanceMarked: false } });
    const marked = { ...WORKDAY, attendanceStatus: 'WFH' as const, activeMs: 0 };
    vi.mocked(setup.portal.markAttendance).mockResolvedValue(marked);

    await expect(setup.controller.markAttendance('WFH', 'home today')).resolves.toBe(marked);

    expect(setup.portal.markAttendance).toHaveBeenCalledWith('WFH', 'home today');
    expect(setup.latest().workday).toEqual(marked);
    await expect(setup.controller.start()).resolves.toBeUndefined();
    await setup.controller.stop();
  });

  it('keeps the day base mid-session, but resets it when the date rolls over', async () => {
    const setup = await signedIn();
    await setup.controller.start();
    await vi.advanceTimersByTimeAsync(3000);
    const before = setup.controller.getState().stats.dayActiveMs;
    expect(before).toBe(603_000);

    // The same day, already including this session's uploads: no double count.
    vi.mocked(setup.portal.heartbeat).mockResolvedValue(
      me({ workday: { ...WORKDAY, activeMs: 900_000 } }),
    );
    await vi.advanceTimersByTimeAsync(57_000);
    expect(setup.controller.getState().stats.dayActiveMs).toBe(660_000);

    // A new date: yesterday's session is not today's progress.
    vi.mocked(setup.portal.heartbeat).mockResolvedValue(
      me({ workday: { ...WORKDAY, date: '2026-02-04', activeMs: 0 } }),
    );
    await vi.advanceTimersByTimeAsync(60_000);
    expect(setup.controller.getState().stats.dayActiveMs).toBe(120_000);
    await setup.controller.stop();
  });
});
