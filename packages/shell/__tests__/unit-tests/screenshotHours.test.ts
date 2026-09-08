import { describe, expect, it } from 'vitest';
import { groupScreenshotsByHour } from '@/pages/tracker-view/TrackerScreenshotGallery';

/** Only the two fields the grouping actually reads. */
const shot = (id: string, capturedAt: string) => ({ id, capturedAt });

describe('groupScreenshotsByHour', () => {
  it('buckets a day into the hours the shots were taken in', () => {
    const { hours } = groupScreenshotsByHour(
      [
        shot('a', '2026-02-03T10:07:00.000Z'),
        shot('b', '2026-02-03T10:52:00.000Z'),
        shot('c', '2026-02-03T11:03:00.000Z'),
      ],
      'UTC',
    );

    expect(hours.map((hour) => hour.key)).toEqual(['2026-02-03 10', '2026-02-03 11']);
    expect(hours[0].shots.map((s) => s.id)).toEqual(['a', 'b']);
    expect(hours[1].shots.map((s) => s.id)).toEqual(['c']);
  });

  it('reads the hour in the viewing zone, not in UTC', () => {
    // 18:45 UTC is 00:15 the next day in Kolkata — a different hour AND a different day.
    const { hours } = groupScreenshotsByHour(
      [shot('a', '2026-02-03T18:45:00.000Z')],
      'Asia/Kolkata',
    );

    expect(hours[0].key).toBe('2026-02-04 00');
  });

  it('marks each hour’s start exactly, on a half-hour offset too', () => {
    // Truncating the UTC instant to the hour would give 18:00Z, which is 23:30 in Kolkata —
    // a heading half an hour adrift of the hour it labels.
    const { hours } = groupScreenshotsByHour(
      [shot('a', '2026-02-03T18:45:00.000Z')],
      'Asia/Kolkata',
    );

    expect(hours[0].startsAt).toBe('2026-02-03T18:30:00.000Z');
  });

  it('orders the day by capture time whatever order the portal returned', () => {
    const { ordered } = groupScreenshotsByHour(
      [shot('late', '2026-02-03T15:00:00.000Z'), shot('early', '2026-02-03T09:00:00.000Z')],
      'UTC',
    );

    expect(ordered.map((s) => s.id)).toEqual(['early', 'late']);
  });

  it('points each hour at its first shot’s place in the day', () => {
    // This index is what the full-screen viewer opens on, so an hour that mis-points opens
    // somebody else's screenshot.
    const { hours } = groupScreenshotsByHour(
      [
        shot('a', '2026-02-03T09:10:00.000Z'),
        shot('b', '2026-02-03T09:40:00.000Z'),
        shot('c', '2026-02-03T10:05:00.000Z'),
      ],
      'UTC',
    );

    expect(hours.map((hour) => hour.firstIndex)).toEqual([0, 2]);
  });

  it('drops a shot whose timestamp will not parse rather than inventing an hour for it', () => {
    const { ordered, hours } = groupScreenshotsByHour(
      [shot('broken', 'not-a-date'), shot('a', '2026-02-03T09:10:00.000Z')],
      'UTC',
    );

    expect(ordered.map((s) => s.id)).toEqual(['a']);
    expect(hours).toHaveLength(1);
  });

  it('has nothing to group on a day with no captures', () => {
    expect(groupScreenshotsByHour([], 'UTC')).toEqual({ ordered: [], hours: [] });
  });
});
