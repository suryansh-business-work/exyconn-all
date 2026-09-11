import { describe, it, expect } from 'vitest';
import type { DayScreenshot } from '../../src/types';
import { summarizeDay, type RawDay } from '../../src/portal/day-summary';

function shot(id: string, capturedAt: string): DayScreenshot {
  return {
    id,
    capturedAt,
    imageUrl: `https://cdn.example/${id}.jpg`,
    blurred: false,
    activityPercent: 62,
  };
}

const TEN_MINUTES = 600_000;

/** A ten-minute interval starting at `startedAt`, with the portal's own activity figure. */
function interval(
  startedAt: string,
  activeMs: number,
  idleMs: number,
  keyCount: number,
  mouseCount: number,
): RawDay['intervals'][number] {
  return {
    startedAt,
    endedAt: new Date(Date.parse(startedAt) + TEN_MINUTES).toISOString(),
    activeMs,
    idleMs,
    keyCount,
    mouseCount,
    activityPercent: Math.round((activeMs / (activeMs + idleMs)) * 100),
  };
}

describe('summarizeDay', () => {
  it('sums every interval, counts the sessions and orders the intervals oldest first', () => {
    const day: RawDay = {
      intervals: [
        interval('2026-02-03T09:10:00.000Z', 300_000, 300_000, 90, 30),
        interval('2026-02-03T09:00:00.000Z', 540_000, 60_000, 400, 120),
      ],
      screenshots: [shot('a', '2026-02-03T09:10:00.000Z')],
      sessions: [{ id: 's1' }, { id: 's2' }],
    };

    expect(summarizeDay(day)).toEqual({
      activeMs: 840_000,
      idleMs: 360_000,
      keyCount: 490,
      mouseCount: 150,
      sessions: 2,
      screenshots: [shot('a', '2026-02-03T09:10:00.000Z')],
      intervals: [
        {
          startedAt: '2026-02-03T09:00:00.000Z',
          endedAt: '2026-02-03T09:10:00.000Z',
          activeMs: 540_000,
          idleMs: 60_000,
          activityPercent: 90,
        },
        {
          startedAt: '2026-02-03T09:10:00.000Z',
          endedAt: '2026-02-03T09:20:00.000Z',
          activeMs: 300_000,
          idleMs: 300_000,
          activityPercent: 50,
        },
      ],
    });
  });

  it('returns zeroed totals and no screenshots for an untracked day', () => {
    expect(summarizeDay({ intervals: [], screenshots: [], sessions: [] })).toEqual({
      activeMs: 0,
      idleMs: 0,
      keyCount: 0,
      mouseCount: 0,
      sessions: 0,
      screenshots: [],
      intervals: [],
    });
  });

  it('copies the screenshots rather than aliasing the portal payload', () => {
    const screenshots = [shot('a', '2026-02-03T09:10:00.000Z')];
    const summary = summarizeDay({ intervals: [], screenshots, sessions: [] });

    expect(summary.screenshots).not.toBe(screenshots);
    expect(summary.screenshots).toEqual(screenshots);
  });
});
