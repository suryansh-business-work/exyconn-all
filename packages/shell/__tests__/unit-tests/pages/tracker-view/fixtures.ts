import type {
  TrackerDayBucketData,
  TrackerDayData,
  TrackerScreenshotData,
} from '@/pages/tracker-view/tracker.types';

/** Shared tracker fixtures: only what a test sets differs from these neutral defaults. */
export const HOUR_MS = 3_600_000;

export function makeBucket(patch: Partial<TrackerDayBucketData> = {}): TrackerDayBucketData {
  return {
    date: '2026-02-03',
    activeMs: 0,
    idleMs: 0,
    manualMs: 0,
    keyCount: 0,
    mouseCount: 0,
    sessions: 0,
    ...patch,
  };
}

type Session = TrackerDayData['sessions'][number];
type Interval = TrackerDayData['intervals'][number];

export function makeSession(patch: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    startedAt: '2026-02-03T09:00:00.000Z',
    endedAt: null,
    status: 'CLOSED',
    projectId: 'p1',
    projectName: 'Payroll revamp',
    activeMs: 0,
    idleMs: 0,
    keyCount: 0,
    mouseCount: 0,
    ...patch,
  };
}

export function makeInterval(patch: Partial<Interval> = {}): Interval {
  return {
    id: 'interval-1',
    sessionId: 'session-1',
    startedAt: '2026-02-03T09:00:00.000Z',
    endedAt: '2026-02-03T09:10:00.000Z',
    keyCount: 0,
    mouseCount: 0,
    activeMs: 0,
    idleMs: 0,
    activityPercent: 0,
    ...patch,
  };
}

export function makeShot(patch: Partial<TrackerScreenshotData> = {}): TrackerScreenshotData {
  return {
    id: 'shot-1',
    sessionId: 'session-1',
    intervalStartedAt: '2026-02-03T09:00:00.000Z',
    capturedAt: '2026-02-03T09:05:00.000Z',
    imageUrl: 'https://img.test/shot-1.png',
    displayId: 'display-1',
    blurred: false,
    activityPercent: 50,
    ...patch,
  };
}

export function makeDay(patch: Partial<TrackerDayData> = {}): TrackerDayData {
  return { intervals: [], screenshots: [], sessions: [], appUsage: [], ...patch };
}

/** A formatter that shows the raw instant, so a test can see which one a label was built from. */
export const echoFormat = (value: string) => `at ${value}`;
