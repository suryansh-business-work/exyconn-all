import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureConsole, type Logger } from '../../src';

function fakeLogger() {
  return { error: vi.fn(), warn: vi.fn() };
}

function fakeConsole() {
  return { error: vi.fn(), warn: vi.fn() };
}

describe('captureConsole', () => {
  const realError = console.error;
  const realWarn = console.warn;
  afterEach(() => {
    console.error = realError;
    console.warn = realWarn;
  });

  it('prints first, then forwards the words and the first error-like argument', () => {
    const logger = fakeLogger();
    const target = fakeConsole();
    const { error: printError } = target;
    captureConsole(logger as unknown as Logger, target);

    const failure = new Error('Network request failed');
    target.error('Saving', failure, 'for', 42);
    expect(printError).toHaveBeenCalledWith('Saving', failure, 'for', 42);
    expect(logger.error).toHaveBeenCalledWith('Saving for 42', failure);
  });

  it('forwards a warning with no error as text only', () => {
    const logger = fakeLogger();
    const target = fakeConsole();
    const { warn: printWarn } = target;
    captureConsole(logger as unknown as Logger, target);

    target.warn('Deprecated', { key: 'value' });
    expect(printWarn).toHaveBeenCalledWith('Deprecated', { key: 'value' });
    expect(logger.warn).toHaveBeenCalledWith('Deprecated {"key":"value"}', undefined);
  });

  it('patches each console once, so a second call does not double-send', () => {
    const logger = fakeLogger();
    const target = fakeConsole();
    captureConsole(logger as unknown as Logger, target);
    captureConsole(logger as unknown as Logger, target);
    target.error('once');
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('patches the global console when no target is given', () => {
    const print = vi.fn();
    console.error = print;
    const logger = fakeLogger();
    captureConsole(logger as unknown as Logger);

    console.error('Global failure');
    expect(print).toHaveBeenCalledWith('Global failure');
    expect(logger.error).toHaveBeenCalledWith('Global failure', undefined);
  });
});
