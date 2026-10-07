import { captureConsole } from '@exyconn/logger';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installCrashHandlers } from '../../../src/tracker/crash-handlers';
import { logger } from '../../../src/tracker/logger';
import { markFatal, startSessionMarker } from '../../../src/tracker/session-marker';

vi.mock('@exyconn/logger', () => ({ captureConsole: vi.fn() }));
vi.mock('../../../src/tracker/logger', () => ({
  logger: { capture: vi.fn(), info: vi.fn() },
}));
vi.mock('../../../src/tracker/session-marker', () => ({
  markFatal: vi.fn(),
  startSessionMarker: vi.fn(),
}));

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;
type Tracker = (options: {
  allRejections: boolean;
  onUnhandled: (id: number, rejection: unknown) => void;
}) => void;

const previous = vi.fn<GlobalHandler>();
let installed: GlobalHandler | null = null;

function handler(): GlobalHandler {
  if (installed === null) {
    throw new Error('No global handler was installed.');
  }
  return installed;
}

beforeEach(() => {
  installed = null;
  Object.assign(globalThis, {
    ErrorUtils: {
      getGlobalHandler: () => previous,
      setGlobalHandler: (next: GlobalHandler) => {
        installed = next;
      },
    },
  });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'ErrorUtils');
  Reflect.deleteProperty(globalThis, 'HermesInternal');
});

describe('installCrashHandlers', () => {
  it('forwards the console, starts the session marker and says the app started', () => {
    installCrashHandlers();
    expect(captureConsole).toHaveBeenCalledWith(logger);
    expect(startSessionMarker).toHaveBeenCalledWith(logger);
    expect(logger.info).toHaveBeenCalledWith('App started');
  });

  it('logs an uncaught error, then hands it to React Native’s own handler', () => {
    installCrashHandlers();
    const error = new Error('render failed');
    handler()(error, false);
    expect(logger.capture).toHaveBeenCalledWith(error, { context: { fatal: false } });
    expect(previous).toHaveBeenCalledWith(error, false);
    expect(markFatal).not.toHaveBeenCalled();
  });

  it('marks a fatal error on disk before the app closes', () => {
    installCrashHandlers();
    const error = new Error('fatal');
    handler()(error, true);
    expect(markFatal).toHaveBeenCalledTimes(1);
    expect(logger.capture).toHaveBeenCalledWith(error, { context: { fatal: true } });
  });

  it('treats an error with no fatal flag as not fatal', () => {
    installCrashHandlers();
    handler()('plain string');
    expect(logger.capture).toHaveBeenCalledWith('plain string', { context: { fatal: false } });
  });
});

describe('unhandled promise rejections', () => {
  it('are left to the dev build’s own reporting', () => {
    const track = vi.fn<Tracker>();
    Object.assign(globalThis, { HermesInternal: { enablePromiseRejectionTracker: track } });
    installCrashHandlers();
    expect(track).not.toHaveBeenCalled();
  });

  it('are tracked and logged in a release build', () => {
    Object.assign(globalThis, { __DEV__: false });
    const track = vi.fn<Tracker>();
    Object.assign(globalThis, { HermesInternal: { enablePromiseRejectionTracker: track } });
    installCrashHandlers();
    const [{ allRejections, onUnhandled }] = track.mock.calls[0];
    expect(allRejections).toBe(true);
    onUnhandled(1, 'lost');
    expect(logger.capture).toHaveBeenCalledWith('lost', {
      context: { kind: 'unhandledrejection' },
    });
  });

  it('are skipped quietly on an engine without the tracker', () => {
    Object.assign(globalThis, { __DEV__: false });
    expect(() => installCrashHandlers()).not.toThrow();
    Object.assign(globalThis, { HermesInternal: {} });
    expect(() => installCrashHandlers()).not.toThrow();
  });
});
