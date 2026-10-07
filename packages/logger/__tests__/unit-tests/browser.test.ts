import { describe, expect, it, vi } from 'vitest';
import { captureBrowserErrors, type Logger } from '../../src';

type Listener = (event: unknown) => void;

function fakeWindow() {
  const listeners = new Map<string, Listener>();
  return {
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
    fire: (type: string, event: unknown) => listeners.get(type)?.(event),
    types: () => [...listeners.keys()],
  };
}

function setup() {
  const capture = vi.fn();
  const target = fakeWindow();
  captureBrowserErrors({ capture } as unknown as Logger, target);
  return { capture, target };
}

describe('captureBrowserErrors', () => {
  it('listens for uncaught errors and unhandled rejections', () => {
    expect(setup().target.types()).toEqual(['error', 'unhandledrejection']);
  });

  it('captures the error of an error event with where it happened', () => {
    const { capture, target } = setup();
    const error = new TypeError('x is undefined');
    target.fire('error', { error, message: 'ignored', filename: 'app.js', lineno: 3, colno: 9 });
    expect(capture).toHaveBeenCalledWith(error, {
      context: { filename: 'app.js', lineno: 3, colno: 9 },
    });
  });

  it('captures the message when the error event carries no error (cross-origin script)', () => {
    const { capture, target } = setup();
    target.fire('error', { message: 'Script error.' });
    expect(capture).toHaveBeenCalledWith('Script error.', {
      context: { filename: undefined, lineno: undefined, colno: undefined },
    });
  });

  it('captures the reason of an unhandled rejection, even when there is none', () => {
    const { capture, target } = setup();
    const reason = new Error('fetch failed');
    target.fire('unhandledrejection', { reason });
    target.fire('unhandledrejection', {});
    expect(capture).toHaveBeenNthCalledWith(1, reason, { context: { kind: 'unhandledrejection' } });
    expect(capture).toHaveBeenNthCalledWith(2, undefined, {
      context: { kind: 'unhandledrejection' },
    });
  });
});
