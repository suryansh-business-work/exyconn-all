import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deviceTimezone } from '../../src/timezone';
import type { TrackerMeResponse } from '../../src/portal/client';
import { me } from './controller-data';
import { rig, signedIn } from './controller-fixture';
import { queuedInterval, screen } from './engine-fixture';

describe('TrackerController logout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T10:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('uploads what is queued, then forgets the employee and their zone', async () => {
    const setup = await signedIn({ timezone: 'Asia/Kolkata', unreadMessages: 2 });
    setup.platform.deps.outbox.enqueueInterval('s0', queuedInterval('2026-02-03T09:00:00.000Z'));

    await setup.controller.logout('Your access was removed.');

    expect(setup.platform.deps.portal.syncIntervals).toHaveBeenCalledTimes(1);
    expect(setup.store.token).toBeNull();
    expect(setup.latest()).toMatchObject({
      status: 'signed-out',
      user: null,
      settings: null,
      workday: null,
      projects: [],
      tasks: [],
      unreadMessages: 0,
      presence: { status: 'WORKING', note: '', since: null },
      timezone: deviceTimezone(),
      signedOutReason: 'Your access was removed.',
    });
  });

  it('does nothing the second time', async () => {
    const setup = await signedIn();

    await setup.controller.logout();
    await setup.controller.logout();

    expect(setup.store.clearToken).toHaveBeenCalledTimes(1);
    expect(setup.latest().signedOutReason).toBeNull();
  });

  it('signs out even when the final upload throws', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const setup = await signedIn();
    setup.platform.deps.outbox.enqueueInterval('s0', queuedInterval('2026-02-03T09:00:00.000Z'));
    setup.platform.storage.failWrites = true;

    await setup.controller.logout();

    expect(error).toHaveBeenCalledWith('Final sync before sign-out failed', expect.any(Error));
    expect(setup.latest().status).toBe('signed-out');
  });

  it('stops polling the portal once signed out', async () => {
    const setup = await signedIn();
    await setup.controller.logout();

    await vi.advanceTimersByTimeAsync(180_000);

    expect(setup.portal.heartbeat).not.toHaveBeenCalled();
  });

  it('lets a sign-in follow-up that lands after sign-out revive the state, engine-less', async () => {
    // Suspected race, recorded as-is: syncFromPortal is not cancelled by logout.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const setup = rig();
    let answer: (value: TrackerMeResponse) => void = () => undefined;
    vi.mocked(setup.portal.trackerMe).mockImplementation(
      () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    );
    const login = setup.controller.login('asha@example.com', randomUUID(), false);
    await vi.advanceTimersByTimeAsync(0);
    await setup.controller.logout();
    answer(me());
    await login;

    expect(setup.latest()).toMatchObject({ status: 'idle', user: { id: 'u1' } });
    // With no engine, the controls are inert and a second sign-out still completes.
    await setup.controller.start();
    setup.controller.pause();
    setup.controller.resume();
    await setup.controller.syncNow();
    await setup.controller.logout();
    expect(setup.latest().status).toBe('signed-out');
    expect(setup.store.clearToken).toHaveBeenCalledTimes(2);
  });
});

describe('TrackerController engine hooks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T10:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('signs out with the engine’s reason when access is revoked', async () => {
    const setup = await signedIn();

    setup.hooks().onAuthError('Your tracker access was removed.');
    await vi.advanceTimersByTimeAsync(0);

    expect(setup.latest()).toMatchObject({
      status: 'signed-out',
      signedOutReason: 'Your tracker access was removed.',
    });
  });

  it('logs a forced sign-out that itself fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const setup = await signedIn();
    const cause = new Error('capture grant stuck');
    setup.platform.deps.session = {
      begin: () => Promise.resolve(),
      end: () => Promise.reject(cause),
    };
    await setup.controller.start();

    setup.hooks().onAuthError('gone');
    await vi.advanceTimersByTimeAsync(0);

    expect(error).toHaveBeenCalledWith('Forced sign-out failed', cause);
  });

  it('forwards stats, captures, auto-pauses and webcam composition to the shell', async () => {
    const setup = await signedIn();
    const hooks = setup.hooks();
    const stats = { ...setup.controller.getState().stats, keyCount: 42 };
    const report = { capture: { count: 1, capturedAt: '2026-02-03T10:00:00.000Z' }, stats };
    const input = {
      screen: screen('d1').image,
      mimeType: 'image/png',
      corner: 'top-left' as const,
      quality: 90,
    };

    hooks.onStats(stats);
    hooks.onCapture(report);
    hooks.onAutoPaused(5);

    expect(setup.latest().stats.keyCount).toBe(42);
    expect(setup.deps.onCapture).toHaveBeenCalledWith(report);
    expect(setup.deps.notifier.autoPaused).toHaveBeenCalledWith(5);
    await expect(hooks.composeWithWebcam(input)).resolves.toBe('composited');
    expect(setup.deps.composeWithWebcam).toHaveBeenCalledWith(input);
  });
});
