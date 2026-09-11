import type { WindowUsage } from './types';

/**
 * Accumulates how long each foreground app (and, where the platform knows it, window) was in
 * front, one observation at a time.
 *
 * Each app asks its own OS what is in front — a desktop reads the focused window, a phone reads
 * the app its usage stats last moved to the foreground — and hands the answer here. Every
 * observation credits the time since the previous one to whatever was in front THEN, so a
 * sample is never double-counted and a gap is never credited to the app that ended it.
 */
export class ForegroundUsage {
  private lastKey: string | null = null;
  private lastApp = '';
  private lastTitle = '';
  private lastAt = 0;
  private readonly totals = new Map<string, WindowUsage>();

  /** Records what is in front now, crediting the elapsed time to what was in front before. */
  observe(now: number, appName: string, windowTitle: string): void {
    if (this.lastKey && this.lastAt > 0) {
      this.credit(this.lastKey, this.lastApp, this.lastTitle, now - this.lastAt);
    }
    this.lastKey = `${appName} ${windowTitle}`;
    this.lastApp = appName;
    this.lastTitle = windowTitle;
    this.lastAt = now;
  }

  private credit(key: string, appName: string, windowTitle: string, durationMs: number): void {
    if (durationMs <= 0) {
      return;
    }
    const existing = this.totals.get(key);
    if (existing) {
      existing.durationMs += durationMs;
    } else {
      this.totals.set(key, { appName, windowTitle, durationMs });
    }
  }

  /** Returns the interval's aggregated usage and resets, respecting the title setting. */
  drain(now: number, keepTitles: boolean): WindowUsage[] {
    if (this.lastKey && this.lastAt > 0) {
      this.credit(this.lastKey, this.lastApp, this.lastTitle, now - this.lastAt);
      this.lastAt = now;
    }
    const slices = [...this.totals.values()].map((slice) => ({
      ...slice,
      windowTitle: keepTitles ? slice.windowTitle : '',
    }));
    this.totals.clear();
    return slices;
  }
}
