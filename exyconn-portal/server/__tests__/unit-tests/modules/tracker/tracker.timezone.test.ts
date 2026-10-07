import {
  zonedDateKey,
  zonedDayStartUtc,
  zonedHour,
} from '../../../../src/modules/tracker/tracker.timezone';

describe('zonedHour', () => {
  it('reads the hour on the wall clock of the zone, not in UTC', () => {
    const instant = new Date('2026-09-04T03:30:00.000Z');

    expect(zonedHour(instant, 'UTC')).toBe(3);
    expect(zonedHour(instant, 'Asia/Kolkata')).toBe(9);
    expect(zonedHour(instant, 'America/New_York')).toBe(23);
  });

  it('reads midnight as 0, never 24', () => {
    expect(zonedHour(new Date('2026-09-04T00:00:00.000Z'), 'UTC')).toBe(0);
  });
});

describe('zonedDayStartUtc', () => {
  it('keys a late-evening instant in a zone behind UTC on the local, earlier day', () => {
    // 02:00 UTC on the 5th is still 22:00 on the 4th in New York.
    const instant = new Date('2026-09-05T02:00:00.000Z');

    expect(zonedDayStartUtc(instant, 'America/New_York').toISOString()).toBe(
      '2026-09-04T00:00:00.000Z',
    );
    expect(zonedDateKey(instant, 'America/New_York')).toBe('2026-09-04');
  });

  it('pads single-digit months and days in the day key', () => {
    expect(zonedDateKey(new Date('2026-01-02T12:00:00.000Z'), 'UTC')).toBe('2026-01-02');
  });
});
