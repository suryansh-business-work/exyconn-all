/**
 * A stand-in for Electron's `Notification`, shared by the notifier tests: it records every
 * notification shown, and the test decides whether the OS supports them or refuses to build one.
 */
export interface Shown {
  options: Record<string, unknown>;
  events: Map<string, () => void>;
  shown: boolean;
}

export const center = { supported: true, broken: false, shown: [] as Shown[] };

export class FakeNotification implements Shown {
  static isSupported(): boolean {
    return center.supported;
  }
  readonly options: Record<string, unknown>;
  readonly events = new Map<string, () => void>();
  shown = false;
  constructor(options: Record<string, unknown>) {
    if (center.broken) {
      throw new Error('notification centre unavailable');
    }
    this.options = options;
    center.shown.push(this);
  }
  on(event: string, fn: () => void): void {
    this.events.set(event, fn);
  }
  show(): void {
    this.shown = true;
  }
}

/** Back to a centre that supports notifications and has shown none. */
export function resetCenter(): void {
  center.supported = true;
  center.broken = false;
  center.shown.length = 0;
}

/** The notification shown most recently. */
export function lastShown(): Shown {
  const shown = center.shown.at(-1);
  if (shown === undefined) {
    throw new Error('No notification was shown');
  }
  return shown;
}
