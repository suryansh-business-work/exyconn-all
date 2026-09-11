import type { Logger } from './types';

/**
 * The slice of `window` this needs, typed locally so the package still type-checks in Node
 * and React Native projects, which have no DOM lib.
 */
interface WindowLike {
  addEventListener(type: 'error' | 'unhandledrejection', listener: (event: unknown) => void): void;
}

interface ErrorEventLike {
  error?: unknown;
  message?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
}

/**
 * Sends every uncaught error and unhandled promise rejection in a browser window (the portals
 * and the desktop tracker's renderer). Resource load failures do not bubble to `window`, so
 * only script errors arrive here.
 */
export function captureBrowserErrors(logger: Logger, target: WindowLike): void {
  target.addEventListener('error', (event) => {
    const { error, message, filename, lineno, colno } = event as ErrorEventLike;
    logger.capture(error ?? message, { context: { filename, lineno, colno } });
  });
  target.addEventListener('unhandledrejection', (event) => {
    const { reason } = event as { reason?: unknown };
    logger.capture(reason, { context: { kind: 'unhandledrejection' } });
  });
}
