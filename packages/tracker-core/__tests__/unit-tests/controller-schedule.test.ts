import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TrackerAuthError } from '../../src/portal/portal-error';
import { ENGINE_SETTINGS } from './engine-fixture';
import { me } from './controller-data';
import { signedIn } from './controller-fixture';

const SCHEDULED = {
  ...ENGINE_SETTINGS,
  autoStartEnabled: true,
  autoStartHour: 9,
  autoStopHour: 18,
};
const POLL = 60_000;

describe('TrackerController portal poll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T10:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('checks in once a minute and re-renders only when something moved', async () => {
    const setup = await signedIn();
    const quiet = setup.states.length;

    await vi.advanceTimersByTimeAsync(POLL);
    expect(setup.portal.heartbeat).toHaveBeenCalledTimes(1);
    expect(setup.states.length).toBe(quiet);

    vi.mocked(setup.portal.heartbeat).mockResolvedValue(
      me({ settings: { ...ENGINE_SETTINGS, webcamEnabled: true } }),
    );
    await vi.advanceTimersByTimeAsync(POLL);
    expect(setup.states.length).toBe(quiet + 1);
    expect(setup.latest().permissions).toEqual({ camera: true });
  });

  it('signs out with a reason when the portal says access was revoked', async () => {
    const setup = await signedIn();
    vi.mocked(setup.portal.heartbeat).mockRejectedValue(new TrackerAuthError('revoked'));

    await vi.advanceTimersByTimeAsync(POLL);

    expect(setup.latest()).toMatchObject({
      status: 'signed-out',
      signedOutReason:
        'Your tracker access was removed. Ask your administrator to restore it, then sign in again.',
    });
  });

  it('rides out an unreachable portal without disturbing the session', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const setup = await signedIn();
    const cause = new TypeError('fetch failed');
    vi.mocked(setup.portal.heartbeat).mockRejectedValue(cause);

    await vi.advanceTimersByTimeAsync(POLL);

    expect(error).toHaveBeenCalledWith('Portal heartbeat failed', cause);
    expect(setup.latest().status).toBe('idle');
  });

  it('logs a poll whose forced sign-out fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const setup = await signedIn();
    const cause = new Error('capture grant stuck');
    setup.platform.deps.session = {
      begin: () => Promise.resolve(),
      end: () => Promise.reject(cause),
    };
    await setup.controller.start();
    vi.mocked(setup.portal.heartbeat).mockRejectedValue(new TrackerAuthError('revoked'));

    await vi.advanceTimersByTimeAsync(POLL);

    expect(error).toHaveBeenCalledWith('Portal poll failed', cause);
  });
});

describe('TrackerController schedule', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts tracking inside the window once attendance is marked', async () => {
    vi.setSystemTime(new Date('2026-02-03T10:00:00.000Z'));
    const setup = await signedIn({ settings: SCHEDULED });

    await vi.advanceTimersByTimeAsync(POLL);

    expect(setup.platform.deps.portal.startSession).toHaveBeenCalledWith(
      '2026-02-03T10:01:00.000Z',
      'global',
      '',
    );
    expect(setup.latest().status).toBe('tracking');
    await setup.controller.stop();
  });

  it('stops a running session at the end of the window, and says so', async () => {
    vi.setSystemTime(new Date('2026-02-03T17:59:30.000Z'));
    const setup = await signedIn({ settings: SCHEDULED });
    await setup.controller.start();

    await vi.advanceTimersByTimeAsync(POLL);

    expect(setup.latest().status).toBe('idle');
    expect(setup.platform.deps.portal.stopSession).toHaveBeenCalledTimes(1);
    expect(setup.deps.notifier.autoStopped).toHaveBeenCalledWith('6:00 PM');
  });

  it('honours an early finish until the window ends, then starts again the next day', async () => {
    vi.setSystemTime(new Date('2026-02-03T17:00:00.000Z'));
    const setup = await signedIn({ settings: SCHEDULED });
    await setup.controller.start();
    await setup.controller.stop();

    await vi.advanceTimersByTimeAsync(POLL);
    expect(setup.latest().status).toBe('idle');

    vi.setSystemTime(new Date('2026-02-03T20:00:00.000Z'));
    await vi.advanceTimersByTimeAsync(POLL);
    expect(setup.latest().status).toBe('idle');

    vi.setSystemTime(new Date('2026-02-04T09:30:00.000Z'));
    await vi.advanceTimersByTimeAsync(POLL);
    expect(setup.latest().status).toBe('tracking');
    expect(setup.platform.deps.portal.startSession).toHaveBeenCalledTimes(2);
    await setup.controller.stop();
  });

  it('retries on the next check-in when a scheduled start fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.setSystemTime(new Date('2026-02-03T10:00:00.000Z'));
    const setup = await signedIn({ settings: SCHEDULED });
    const cause = new Error('Screen recording not granted');
    vi.mocked(setup.platform.deps.portal.startSession).mockRejectedValueOnce(cause);

    await vi.advanceTimersByTimeAsync(POLL);
    expect(error).toHaveBeenCalledWith('Scheduled tracking action failed', cause);
    expect(setup.latest().status).toBe('idle');

    await vi.advanceTimersByTimeAsync(POLL);
    expect(setup.latest().status).toBe('tracking');
    await setup.controller.stop();
  });

  it('does nothing when the workspace runs no schedule', async () => {
    vi.setSystemTime(new Date('2026-02-03T10:00:00.000Z'));
    const setup = await signedIn();

    await vi.advanceTimersByTimeAsync(POLL);

    expect(setup.platform.deps.portal.startSession).not.toHaveBeenCalled();
  });
});
