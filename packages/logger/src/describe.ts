/** Text is cut to these lengths before it is queued — the server cuts to the same. */
export const LOG_LIMITS = {
  message: 2000,
  stack: 12_000,
  componentStack: 6000,
  context: 6000,
  breadcrumb: 300,
} as const;

/** A thrown value reduced to what a log row holds. */
export interface Described {
  text: string;
  errorName: string | null;
  stack: string | null;
}

interface ErrorLike {
  message: string;
  name?: unknown;
  stack?: unknown;
}

/** Errors that crossed a bridge (IPC, React Native) are not always `instanceof Error`. */
export function isErrorLike(value: unknown): value is ErrorLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { message?: unknown }).message === 'string'
  );
}

export function cut(text: string | null | undefined, max: number): string | null {
  if (text === null || text === undefined || text === '') {
    return null;
  }
  return text.length > max ? text.slice(0, max) : text;
}

/** Any value as readable text: strings as-is, everything else as JSON where it can be. */
export function stringify(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value) ?? typeof value;
  } catch {
    return `[unserializable ${typeof value}]`;
  }
}

export function describeValue(value: unknown): Described {
  if (isErrorLike(value)) {
    return {
      text: value.message,
      errorName: typeof value.name === 'string' ? value.name : null,
      stack: typeof value.stack === 'string' ? value.stack : null,
    };
  }
  return { text: stringify(value), errorName: null, stack: null };
}

/** The call site's extra detail as JSON text, or null when there is none. */
export function contextText(context: Record<string, unknown> | undefined): string | null {
  if (!context || Object.keys(context).length === 0) {
    return null;
  }
  return cut(stringify(context), LOG_LIMITS.context);
}
