// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import type { LogBatch, LoggerConfig } from '@exyconn/logger';

const { createLogger, captureConsole, captureBrowserErrors, fakeLogger } = vi.hoisted(() => {
  const fakeLogger = { setRoute: vi.fn() };
  return {
    fakeLogger,
    createLogger: vi.fn((_config: unknown) => fakeLogger),
    captureConsole: vi.fn(),
    captureBrowserErrors: vi.fn(),
  };
});

vi.mock('@exyconn/logger', () => ({ createLogger, captureConsole, captureBrowserErrors }));

import { installRendererCrashHandlers, logger } from '../../../src/renderer/logger';

const config = createLogger.mock.calls[0][0] as LoggerConfig;

describe('the renderer logger', () => {
  it('reports as the desktop tracker and leaves device and user to the main process', () => {
    expect(logger).toBe(fakeLogger);
    expect(config.source).toBe('DESKTOP');
    expect(config.app).toBe('tracker-desktop');
    expect(config.device()).toEqual({
      appVersion: null,
      platform: null,
      osVersion: null,
      deviceModel: null,
      deviceId: null,
    });
    expect(config.user()).toBeNull();
  });

  it('sends its batches to main over the bridge, never to the portal', async () => {
    const reportLogs = vi.fn(() => Promise.resolve(true));
    Object.defineProperty(globalThis, 'tracker', { value: { reportLogs }, configurable: true });
    const batch = { entries: [] } as unknown as LogBatch;

    await expect(config.send(batch)).resolves.toBe(true);

    expect(reportLogs).toHaveBeenCalledWith(batch);
  });

  it('queues in this window’s own slot of localStorage', () => {
    const key = `exyconn.tracker.logs:${globalThis.location.pathname}`;

    expect(config.storage?.read()).toBeNull();
    config.storage?.write('[{"message":"queued"}]');

    expect(localStorage.getItem(key)).toBe('[{"message":"queued"}]');
    expect(config.storage?.read()).toBe('[{"message":"queued"}]');
  });
});

describe('installRendererCrashHandlers', () => {
  it('captures the console and the window’s errors under the window’s name', () => {
    installRendererCrashHandlers('screenshots-window');

    expect(captureConsole).toHaveBeenCalledWith(fakeLogger);
    expect(captureBrowserErrors).toHaveBeenCalledWith(fakeLogger, globalThis.window);
    expect(fakeLogger.setRoute).toHaveBeenCalledWith('screenshots-window');
  });
});
