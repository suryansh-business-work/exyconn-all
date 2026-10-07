import { afterEach, describe, expect, it } from 'vitest';
import { installTracker, trackerState } from '../../../../src/renderer/a11y/tracker-fixture';

type Bridge = Record<string, unknown>;

function bridge(): Bridge {
  return (globalThis as unknown as { tracker: Bridge }).tracker;
}

function call(name: string): Promise<unknown> {
  return (bridge()[name] as () => Promise<unknown>)();
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'tracker');
});

describe('trackerState', () => {
  it('puts the requested status on the state and on its live stats', () => {
    const state = trackerState('tracking');
    expect(state.status).toBe('tracking');
    expect(state.stats.status).toBe('tracking');
  });

  it('describes a signed-in employee with everything granted', () => {
    const state = trackerState('idle');
    expect(state.user?.name).toBe('Asha Rao');
    expect(state.permissions.allGranted).toBe(true);
    expect(state.selectedProjectId).toBe(state.projects[0].id);
    expect(state.unreadMessages).toBe(1);
  });

  it('hands out a fresh object on every call', () => {
    const first = trackerState('idle');
    const second = trackerState('idle');
    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });
});

describe('installTracker', () => {
  it('answers getState with the state it was given', async () => {
    const state = trackerState('paused');
    installTracker(state);
    await expect(call('getState')).resolves.toBe(state);
  });

  it('answers the reads with a realistic day of data', async () => {
    installTracker(trackerState('idle'));
    const day = (await call('getDay')) as { screenshots: unknown[]; sessions: number };
    expect(day.screenshots).toHaveLength(2);
    expect(day.sessions).toBe(2);
    await expect(call('getReport')).resolves.toHaveLength(1);
    await expect(call('getMessages')).resolves.toHaveLength(1);
    await expect(call('getTotals')).resolves.toEqual({
      activeMs: 7_200_000,
      idleMs: 900_000,
      screenshots: 12,
      sessions: 4,
    });
    await expect(call('getUpdate')).resolves.toMatchObject({
      stage: 'available',
      version: '9.9.9',
    });
    await expect(call('getAppVersion')).resolves.toBe('1.0.0');
    await expect(call('getManualEntries')).resolves.toEqual([]);
  });

  it('resolves every other command to undefined without doing anything', async () => {
    installTracker(trackerState('idle'));
    await expect(call('startTracking')).resolves.toBeUndefined();
    await expect(call('signOut')).resolves.toBeUndefined();
  });

  it('hands every on* subscription a no-op unsubscribe', () => {
    installTracker(trackerState('idle'));
    const subscribe = bridge().onState as (listener: () => void) => () => unknown;
    const unsubscribe = subscribe(() => undefined);
    expect(typeof unsubscribe).toBe('function');
    expect(unsubscribe()).toBeUndefined();
  });

  it('reports transparency as unsupported', () => {
    installTracker(trackerState('idle'));
    expect(bridge().transparencySupported).toBe(false);
  });

  it('replaces a previously installed bridge', async () => {
    installTracker(trackerState('idle'));
    const next = trackerState('tracking');
    installTracker(next);
    await expect(call('getState')).resolves.toBe(next);
  });
});
