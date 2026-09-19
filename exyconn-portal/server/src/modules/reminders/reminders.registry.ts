import type { Reminder } from './reminders.notify';

/**
 * One module's answer to "what needs chasing today".
 *
 * A source owns its own question — a contract near expiry, a review past its date — and
 * returns reminders. It never sends anything itself: the sweep dedupes, delivers and
 * records, so every module chases in the same voice and nobody re-implements "but only
 * once".
 */
export interface ReminderSource {
  /** Stable key, also written on every log row this source produces. */
  key: string;
  /** How the health screen names it. */
  label: string;
  /** Everything overdue or nearly due, as of `now`. */
  due(now: Date): Promise<Reminder[]>;
}

const sources: ReminderSource[] = [];

/**
 * Registers a source. Called from the module that owns the records, at import time.
 *
 * Registration rather than a central list of imports: a module that grows a due date adds
 * one call in its own folder, and the sweep does not have to know every module exists.
 */
export function registerReminderSource(source: ReminderSource): void {
  const clash = sources.find((existing) => existing.key === source.key);
  if (clash) {
    throw new Error(`Two reminder sources are registered as "${source.key}"`);
  }
  sources.push(source);
}

/** Every registered source, in registration order. */
export function reminderSources(): readonly ReminderSource[] {
  return sources;
}

/** Drops every source — used by tests that register their own. */
export function clearReminderSources(): void {
  sources.length = 0;
}
