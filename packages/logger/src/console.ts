import { isErrorLike, stringify } from './describe';
import type { Logger } from './types';

type ConsoleLike = Pick<Console, 'error' | 'warn'>;

const patched = new WeakSet<ConsoleLike>();

/** `console.error('Saving failed', err)` → message "Saving failed", detail `err`. */
function forward(
  write: (message: string, detail?: unknown) => void,
  args: readonly unknown[],
): void {
  const error = args.find(isErrorLike);
  const message = args
    .filter((arg) => arg !== error)
    .map(stringify)
    .join(' ');
  write(message, error);
}

/**
 * Sends every `console.error` as an ERROR and every `console.warn` as a WARN, while still
 * printing them. That covers the dozens of existing `catch → console.error` call sites
 * without touching each one. Patching the same console twice is a no-op.
 */
export function captureConsole(logger: Logger, target: ConsoleLike = console): void {
  if (patched.has(target)) {
    return;
  }
  patched.add(target);
  const original = { error: target.error.bind(target), warn: target.warn.bind(target) };
  target.error = (...args: unknown[]) => {
    original.error(...args);
    forward(logger.error, args);
  };
  target.warn = (...args: unknown[]) => {
    original.warn(...args);
    forward(logger.warn, args);
  };
}
