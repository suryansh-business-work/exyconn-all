import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The module subscribes to AppState once, at import, and the setup file empties the stub's
 * listeners after every test — so each case loads a fresh copy of both.
 */
async function load() {
  vi.resetModules();
  const { rnTest } = await import('../../mocks/react-native/apis');
  const { appStateIdleSeconds } = await import('../../../../src/tracker/idle/app-state-idle');
  return { rnTest, appStateIdleSeconds };
}

beforeEach(() => {
  vi.useFakeTimers({ now: Date.parse('2026-09-11T09:00:00.000Z') });
});

describe('appStateIdleSeconds', () => {
  it('reads zero while the tracker stays on screen', async () => {
    const { rnTest, appStateIdleSeconds } = await load();
    rnTest.appState('active');
    vi.advanceTimersByTime(60_000);
    expect(appStateIdleSeconds()).toBe(0);
  });

  it('counts the current run while the app is away', async () => {
    const { rnTest, appStateIdleSeconds } = await load();
    rnTest.appState('background');
    vi.advanceTimersByTime(30_000);
    expect(appStateIdleSeconds()).toBe(30);
    vi.advanceTimersByTime(15_000);
    expect(appStateIdleSeconds()).toBe(45);
  });

  it('reports a finished run exactly once after coming back', async () => {
    const { rnTest, appStateIdleSeconds } = await load();
    rnTest.appState('background');
    vi.advanceTimersByTime(90_000);
    rnTest.appState('active');
    vi.advanceTimersByTime(5_000);
    expect(appStateIdleSeconds()).toBe(90);
    expect(appStateIdleSeconds()).toBe(0);
  });

  it('dates the run from the first moment away, through inactive and background', async () => {
    const { rnTest, appStateIdleSeconds } = await load();
    rnTest.appState('inactive');
    vi.advanceTimersByTime(10_000);
    rnTest.appState('background');
    vi.advanceTimersByTime(20_000);
    expect(appStateIdleSeconds()).toBe(30);
  });
});
