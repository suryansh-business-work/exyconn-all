import type { Logger } from '@exyconn/logger';
import { describe, expect, it, vi } from 'vitest';
import type { SessionMarker } from '../../../src/lib/logs/session-marker.rules';
import { markFatal, markRoute, startSessionMarker } from '../../../src/tracker/session-marker';
import { File, fileSystemTest } from '../mocks/expo-file-system';
import { AppState, rnTest } from '../mocks/react-native/apis';

const MARKER_URI = 'file:///document/tracker-session.json';

function fakeLogger() {
  const capture = vi.fn();
  return { capture, logger: { capture } as unknown as Logger };
}

function saved(): SessionMarker {
  return JSON.parse(fileSystemTest.files.get(MARKER_URI) ?? 'null') as SessionMarker;
}

const LAST_RUN: SessionMarker = {
  active: true,
  fatal: false,
  startedAt: '2026-09-11T09:00:00.000Z',
  routes: [{ route: '/dashboard', at: '2026-09-11T09:01:00.000Z' }],
};

describe('startSessionMarker', () => {
  it('writes a fresh marker for a run that starts on screen', () => {
    const { capture, logger } = fakeLogger();
    startSessionMarker(logger);
    expect(capture).not.toHaveBeenCalled();
    expect(saved()).toMatchObject({ active: true, fatal: false, routes: [] });
    expect(Number.isNaN(Date.parse(saved().startedAt))).toBe(false);
  });

  it('marks a run that starts in the background as not on screen', () => {
    AppState.currentState = 'background';
    startSessionMarker(fakeLogger().logger);
    expect(saved().active).toBe(false);
  });

  it('reports a release run that died on screen, with the screens it had open', () => {
    Object.assign(globalThis, { __DEV__: false });
    fileSystemTest.files.set(MARKER_URI, JSON.stringify(LAST_RUN));
    const { capture, logger } = fakeLogger();
    startSessionMarker(logger);
    expect(capture).toHaveBeenCalledWith(expect.objectContaining({ name: 'UnexpectedExit' }), {
      context: { lastScreens: LAST_RUN.routes, startedAt: LAST_RUN.startedAt },
    });
  });

  it('does not report a dev reload as a crash', () => {
    fileSystemTest.files.set(MARKER_URI, JSON.stringify(LAST_RUN));
    const { capture, logger } = fakeLogger();
    startSessionMarker(logger);
    expect(capture).not.toHaveBeenCalled();
  });

  it('owes nothing for a release run that went to the background first', () => {
    Object.assign(globalThis, { __DEV__: false });
    fileSystemTest.files.set(MARKER_URI, JSON.stringify({ ...LAST_RUN, active: false }));
    const { capture, logger } = fakeLogger();
    startSessionMarker(logger);
    expect(capture).not.toHaveBeenCalled();
  });

  it('follows the app between foreground and background', () => {
    startSessionMarker(fakeLogger().logger);
    rnTest.appState('background');
    expect(saved().active).toBe(false);
    rnTest.appState('active');
    expect(saved().active).toBe(true);
  });
});

describe('markRoute and markFatal', () => {
  it('remembers the screens visited, newest last', () => {
    startSessionMarker(fakeLogger().logger);
    markRoute('/dashboard');
    markRoute('/settings');
    expect(saved().routes.map((entry) => entry.route)).toEqual(['/dashboard', '/settings']);
  });

  it('records that a fatal error was already reported for this run', () => {
    startSessionMarker(fakeLogger().logger);
    markFatal();
    expect(saved().fatal).toBe(true);
  });

  it('warns, rather than throws, when the marker cannot be saved', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const write = vi.spyOn(File.prototype, 'write').mockImplementation(() => {
      throw new Error('disk full');
    });
    expect(() => markFatal()).not.toThrow();
    expect(warn).toHaveBeenCalledWith('Could not save the session marker', expect.any(Error));
    write.mockRestore();
    warn.mockRestore();
  });
});
