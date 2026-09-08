/**
 * The SLA arithmetic, with no database and no clock of its own.
 *
 * Every branch here is a promise the support team made to somebody, so it is kept
 * pure and unit-tested: the resolvers stamp dates, this file decides what those
 * dates mean.
 */

/** How a ticket stands against the resolution time promised for its priority. */
export const SLA_STATES = ['ON_TRACK', 'DUE_SOON', 'BREACHED', 'MET'] as const;
export type SlaState = (typeof SLA_STATES)[number];

/** The last quarter of the window is "due soon" — enough warning to still act on it. */
const DUE_SOON_FRACTION = 0.25;

const MINUTE_MS = 60_000;

/** When a ticket raised at `from` must be resolved by, under a policy of `minutes`. */
export function dueAtFrom(from: Date, minutes: number): Date {
  return new Date(from.getTime() + minutes * MINUTE_MS);
}

/** Whole minutes between two stamps, rounded to the nearest minute. Negative is clamped to 0. */
export function minutesBetween(from: Date, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / MINUTE_MS));
}

export interface SlaClocks {
  createdAt: Date;
  /** Null when no policy covered the ticket's priority — nothing was promised. */
  dueAt?: Date | null;
  resolvedAt?: Date | null;
}

/**
 * MET once it was resolved inside the window; BREACHED when it was resolved late or is
 * still open past the deadline; DUE_SOON in the last quarter of the window; ON_TRACK
 * otherwise — which is also what a ticket with no policy reads as, because a promise
 * nobody made cannot be broken.
 */
export function slaState({ createdAt, dueAt, resolvedAt }: SlaClocks, now: Date): SlaState {
  if (!dueAt) {
    return 'ON_TRACK';
  }
  if (resolvedAt) {
    return resolvedAt.getTime() <= dueAt.getTime() ? 'MET' : 'BREACHED';
  }
  if (now.getTime() > dueAt.getTime()) {
    return 'BREACHED';
  }
  const window = dueAt.getTime() - createdAt.getTime();
  const remaining = dueAt.getTime() - now.getTime();
  return remaining <= window * DUE_SOON_FRACTION ? 'DUE_SOON' : 'ON_TRACK';
}

/** True for the states the console counts against the team. */
export function isBreached(clocks: SlaClocks, now: Date): boolean {
  return slaState(clocks, now) === 'BREACHED';
}
