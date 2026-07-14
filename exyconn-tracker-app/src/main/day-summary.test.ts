import { describe, it, expect } from 'vitest';
import type { DayScreenshot } from '@shared/types';
import { summarizeDay, type RawDay } from './day-summary';

function shot(id: string, capturedAt: string): DayScreenshot {
  return {
    id,
    capturedAt,
    imageUrl: `https://cdn.example/${id}.jpg`,
    blurred: false,
    activityPercent: 62,
  };
}

describe('summarizeDay', () => {
  it('sums every interval and counts the sessions of the day', () => {
    const day: RawDay = {
      intervals: [
        { activeMs: 540_000, idleMs: 60_000, keyCount: 400, mouseCount: 120 },
        { activeMs: 300_000, idleMs: 300_000, keyCount: 90, mouseCount: 30 },
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
    });
  });

  it('copies the screenshots rather than aliasing the portal payload', () => {
    const screenshots = [shot('a', '2026-02-03T09:10:00.000Z')];
    const summary = summarizeDay({ intervals: [], screenshots, sessions: [] });

    expect(summary.screenshots).not.toBe(screenshots);
    expect(summary.screenshots).toEqual(screenshots);
  });
});
