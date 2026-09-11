import { dayBoundsOfInstant } from '@exyconn/tracker-core';

/**
 * Which day the screenshot gallery shows. Pure, so the rules a deep link depends on are tested.
 *
 * The gallery is opened two ways: from a day in My Report (explicit `start`/`end` bounds, the
 * day as it runs in the employee's zone), or from a capture notification (`capturedAt`, an
 * instant). An instant is resolved to its day IN THE EMPLOYEE'S ZONE, never the phone's — a
 * capture at 00:30 in Kolkata is still yesterday on a phone left on London time.
 */

export interface DayRange {
  startISO: string;
  endISO: string;
}

/** Route params as expo-router hands them over: a value, a repeated value, or nothing. */
type Param = string | string[] | undefined;

export interface GalleryParams {
  capturedAt?: Param;
  start?: Param;
  end?: Param;
}

/** The gallery route for one day — what My Report's day panel and the day arrows navigate to. */
export function galleryRoute(range: DayRange): {
  pathname: '/screenshots';
  params: { start: string; end: string };
} {
  return { pathname: '/screenshots', params: { start: range.startISO, end: range.endISO } };
}

/** The first value of a route param, or '' when it is absent. */
export function firstParam(value: Param): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

function isInstant(iso: string): boolean {
  return iso !== '' && !Number.isNaN(Date.parse(iso));
}

/**
 * The day to show. Explicit bounds win — day navigation writes them — then a capture instant.
 * Null when the link carries neither, so the gallery can say so instead of showing an empty day.
 */
export function resolveGalleryDay(params: GalleryParams, zone: string): DayRange | null {
  const start = firstParam(params.start);
  const end = firstParam(params.end);
  if (isInstant(start) && isInstant(end) && Date.parse(start) < Date.parse(end)) {
    return { startISO: start, endISO: end };
  }
  const capturedAt = firstParam(params.capturedAt);
  return capturedAt === '' ? null : dayBoundsOfInstant(capturedAt, zone);
}

/**
 * The day before or after `range`, in the zone. Read off the neighbouring INSTANT — the moment
 * the day ends, or the millisecond before it starts — so a DST day is still exactly one day.
 */
export function adjacentDay(
  range: DayRange,
  direction: 'previous' | 'next',
  zone: string,
): DayRange | null {
  if (direction === 'next') {
    return dayBoundsOfInstant(range.endISO, zone);
  }
  return dayBoundsOfInstant(new Date(Date.parse(range.startISO) - 1).toISOString(), zone);
}

/** The next day has begun — there is nothing to page forward into before it does. */
export function hasNextDay(range: DayRange, now: Date): boolean {
  return Date.parse(range.endISO) <= now.getTime();
}

/** Paging through a day wraps, so it never dead-ends on the first or last shot. */
export function stepIndex(index: number, delta: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return (((index + delta) % length) + length) % length;
}

/** Enough columns that a shot stays legible (~300px each), and never fewer than one. */
export function galleryColumns(width: number): number {
  return Math.max(1, Math.floor(width / 300));
}
