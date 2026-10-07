import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { IPC } from '@shared/types';

type Listener = (...args: unknown[]) => unknown;

const { logger, captureConsole, forwardRendererLogs, handlers, appListeners } = vi.hoisted(() => ({
  logger: { setRoute: vi.fn(), capture: vi.fn(), error: vi.fn(), info: vi.fn() },
  captureConsole: vi.fn(),
  forwardRendererLogs: vi.fn(() => Promise.resolve(true)),
  handlers: new Map<string, Listener>(),
  appListeners: new Map<string, Listener>(),
}));

vi.mock('electron', () => ({
  app: {
    on: (event: string, fn: Listener) => appListeners.set(event, fn),
    getVersion: () => '1.10.6',
  },
}));
vi.mock('@exyconn/logger', () => ({ captureConsole }));
vi.mock('../../../src/main/logger', () => ({ logger, forwardRendererLogs }));
vi.mock('../../../src/main/web-security', () => ({
  handleTrusted: (channel: string, fn: Listener) => handlers.set(channel, fn),
}));

import { installMainCrashHandlers } from '../../../src/main/crash-handlers';

const processListeners = new Map<string, Listener>();
let processOn: MockInstance;
let stderrWrite: MockInstance;

beforeEach(() => {
  processListeners.clear();
  // Recorded, not registered: a real uncaughtException handler would swallow the runner's own.
  processOn = vi.spyOn(process, 'on').mockImplementation(((event: string, fn: Listener) => {
    processListeners.set(event, fn);
    return process;
  }) as typeof process.on);
  stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  installMainCrashHandlers();
});

afterEach(() => {
  processOn.mockRestore();
  stderrWrite.mockRestore();
});

describe('installMainCrashHandlers', () => {
  it('captures the console under the main-process route and says the app started', () => {
    expect(captureConsole).toHaveBeenCalledWith(logger);
    expect(logger.setRoute).toHaveBeenCalledWith('main-process');
    expect(logger.info).toHaveBeenCalledWith('App started', { version: '1.10.6' });
  });

  it('logs an uncaught exception and still prints it to stderr', () => {
    const error = new Error('boom');

    processListeners.get('uncaughtException')?.(error);

    expect(stderrWrite).toHaveBeenCalledWith(`${error.stack}\n`);
    expect(logger.capture).toHaveBeenCalledWith(error, {
      context: { kind: 'uncaughtException' },
    });
  });

  it('prints the message when an exception has no stack', () => {
    const error = new Error('no stack');
    error.stack = undefined;

    processListeners.get('uncaughtException')?.(error);

    expect(stderrWrite).toHaveBeenCalledWith('no stack\n');
  });

  it('logs an unhandled rejection', () => {
    processListeners.get('unhandledRejection')?.('rejected');

    expect(logger.capture).toHaveBeenCalledWith('rejected', {
      context: { kind: 'unhandledRejection' },
    });
  });

  it('logs a renderer that dies, with its exit code and page', () => {
    const contents = { getURL: () => 'file:///app/index.html' };

    appListeners.get('render-process-gone')?.({}, contents, { reason: 'crashed', exitCode: 9 });

    expect(logger.error).toHaveBeenCalledWith('Renderer process gone: crashed', undefined, {
      exitCode: 9,
      url: 'file:///app/index.html',
    });
  });

  it('logs a child process that dies, named when it has a name', () => {
    const gone = appListeners.get('child-process-gone');

    gone?.({}, { type: 'GPU', reason: 'oom', exitCode: 3, name: 'gpu-process' });
    gone?.({}, { type: 'Utility', reason: 'killed', exitCode: 1 });

    expect(logger.error).toHaveBeenCalledWith('GPU process gone: oom', undefined, {
      exitCode: 3,
      name: 'gpu-process',
    });
    expect(logger.error).toHaveBeenCalledWith('Utility process gone: killed', undefined, {
      exitCode: 1,
      name: '',
    });
  });

  it('forwards the renderers’ log batches to the portal', async () => {
    const batch = { entries: [] };

    await expect(handlers.get(IPC.reportLogs)?.({}, batch)).resolves.toBe(true);

    expect(forwardRendererLogs).toHaveBeenCalledWith(batch);
  });
});
