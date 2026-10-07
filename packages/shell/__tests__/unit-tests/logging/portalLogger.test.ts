import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LogBatch } from '@exyconn/logger';
import { makeUser } from '../test-utils';

const captureConsole = vi.fn();
const captureBrowserErrors = vi.fn();

vi.mock('@exyconn/logger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/logger')>();
  return {
    ...actual,
    captureConsole: (...args: unknown[]) => captureConsole(...args),
    captureBrowserErrors: (...args: unknown[]) => captureBrowserErrors(...args),
  };
});

/** The queue key for the bundle under test (VITE_PORTAL_APP is unset, so the hub). */
const STORAGE_KEY = 'exyconn.portal.logs:hub';

/** A fresh copy of the module, so the transport set by one test never leaks into the next. */
async function freshLogger() {
  vi.resetModules();
  return import('@/logging/portalLogger');
}

function queued(): Array<{ message: string }> {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Array<{ message: string }>;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('the portal logger', () => {
  it('keeps entries on disk while no transport is connected', async () => {
    const { portalLogger } = await freshLogger();

    portalLogger.info('Opened the payroll page');
    await portalLogger.flush();

    expect(queued().map((entry) => entry.message)).toEqual(['Opened the payroll page']);
  });

  it('sends the queue through the injected transport, then empties it', async () => {
    const { portalLogger, setLogTransport } = await freshLogger();
    const send = vi.fn<(batch: LogBatch) => Promise<unknown>>().mockResolvedValue(true);
    setLogTransport(send);

    portalLogger.info('Saved an invoice');
    await portalLogger.flush();

    expect(send).toHaveBeenCalledTimes(1);
    const batch = send.mock.calls[0][0];
    expect(batch).toMatchObject({
      source: 'PORTAL',
      app: 'hub',
      platform: 'web',
      appVersion: null,
      osVersion: null,
      deviceModel: null,
      deviceId: null,
      user: null,
    });
    expect(batch.entries.map((entry) => entry.message)).toEqual(['Saved an invoice']);
    expect(queued()).toEqual([]);
  });

  it('names the signed-in person, without anything beyond who they are', async () => {
    const { portalLogger, setLogTransport } = await freshLogger();
    const send = vi.fn<(batch: LogBatch) => Promise<unknown>>().mockResolvedValue(true);
    setLogTransport(send);
    localStorage.setItem(
      'exyconn-track.user',
      JSON.stringify(makeUser({ id: 'u-7', roles: ['ADMIN'] })),
    );

    portalLogger.info('Changed a setting');
    await portalLogger.flush();

    expect(send.mock.calls[0][0].user).toEqual({
      id: 'u-7',
      name: 'Asha Rao',
      email: 'asha@example.com',
    });
  });

  it('picks up a queue left behind by the previous page load', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          level: 'INFO',
          message: 'Left over',
          errorName: null,
          stack: null,
          componentStack: null,
          route: null,
          context: null,
          count: 1,
          occurredAt: '2026-10-01T00:00:00.000Z',
          breadcrumbs: [],
        },
      ]),
    );
    const { portalLogger, setLogTransport } = await freshLogger();
    const send = vi.fn<(batch: LogBatch) => Promise<unknown>>().mockResolvedValue(true);
    setLogTransport(send);

    await portalLogger.flush();

    expect(send.mock.calls[0][0].entries.map((entry) => entry.message)).toEqual(['Left over']);
  });

  it('hooks the console and the window into the logger', async () => {
    const { portalLogger, installPortalCrashHandlers } = await freshLogger();

    installPortalCrashHandlers();

    expect(captureConsole).toHaveBeenCalledWith(portalLogger);
    expect(captureBrowserErrors).toHaveBeenCalledWith(portalLogger, window);
  });
});
