import {
  dayKey,
  daysOf,
  optionalRange,
  parseRange,
} from '../../../../src/modules/whatsapp-demo/whatsappDemo.range';

const KOLKATA = 'Asia/Kolkata';

describe('an analytics date range', () => {
  it('reads plain dates as whole days on the company clock, the end day included', () => {
    const range = parseRange('2026-10-01', '2026-10-01', KOLKATA);
    expect(range.from.toISOString()).toBe('2026-09-30T18:30:00.000Z');
    expect(range.to.toISOString()).toBe('2026-10-01T18:30:00.000Z');
  });

  it('carries a date-only end across a month boundary', () => {
    const range = parseRange('2026-01-31', '2026-02-28', 'UTC');
    expect(range.to.toISOString()).toBe('2026-03-01T00:00:00.000Z');
  });

  it('takes ISO date-times as the exact instants they name', () => {
    const range = parseRange('2026-10-01T06:00:00.000Z', '2026-10-01T09:00:00.000Z', KOLKATA);
    expect(range.from.toISOString()).toBe('2026-10-01T06:00:00.000Z');
    expect(range.to.toISOString()).toBe('2026-10-01T09:00:00.000Z');
  });

  it('refuses an end that is not after the start', () => {
    expect(() =>
      parseRange('2026-10-01T09:00:00.000Z', '2026-10-01T09:00:00.000Z', KOLKATA),
    ).toThrow('Choose a valid date range.');
  });

  it('refuses text that is not a date', () => {
    expect(() => parseRange('yesterday', '2026-10-01', KOLKATA)).toThrow(
      'Choose a valid date range.',
    );
    expect(() => parseRange('2026-10-01', 'abcd-ef-gh', KOLKATA)).toThrow(
      'Choose a valid date range.',
    );
  });

  it('allows exactly 366 days and refuses one more', () => {
    expect(parseRange('2026-01-01', '2027-01-01', 'UTC').to.toISOString()).toBe(
      '2027-01-02T00:00:00.000Z',
    );
    expect(() => parseRange('2026-01-01', '2027-01-02', 'UTC')).toThrow(
      'A range can span at most 366 days.',
    );
  });
});

describe('the optional range of the sessions grid', () => {
  it('is null unless both ends are given', () => {
    expect(optionalRange(null, '2026-10-01', KOLKATA)).toBeNull();
    expect(optionalRange('2026-10-01', undefined, KOLKATA)).toBeNull();
    expect(optionalRange('', '', KOLKATA)).toBeNull();
  });

  it('is the parsed range when both are given', () => {
    const range = optionalRange('2026-10-01', '2026-10-02', 'UTC');
    expect(range?.from.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(range?.to.toISOString()).toBe('2026-10-03T00:00:00.000Z');
  });
});

describe('calendar days on the company clock', () => {
  it('reads an instant as its date in the zone', () => {
    const instant = new Date('2026-10-01T20:00:00.000Z');
    expect(dayKey(instant, KOLKATA)).toBe('2026-10-02');
    expect(dayKey(instant, 'UTC')).toBe('2026-10-01');
  });

  it('lists every day a range touches, oldest first', () => {
    const range = parseRange('2026-09-29', '2026-10-02', KOLKATA);
    expect(daysOf(range, KOLKATA)).toEqual([
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
    ]);
  });

  it('lists a single day for a one-day range', () => {
    expect(daysOf(parseRange('2026-10-05', '2026-10-05', KOLKATA), KOLKATA)).toEqual([
      '2026-10-05',
    ]);
  });

  it('counts a partial day at either end', () => {
    const range = {
      from: new Date('2026-10-01T23:00:00.000Z'),
      to: new Date('2026-10-03T01:00:00.000Z'),
    };
    expect(daysOf(range, 'UTC')).toEqual(['2026-10-01', '2026-10-02', '2026-10-03']);
  });

  it('never lists more than 367 days, however long the range', () => {
    const range = {
      from: new Date('2024-01-01T00:00:00.000Z'),
      to: new Date('2026-01-01T00:00:00.000Z'),
    };
    const days = daysOf(range, 'UTC');
    expect(days).toHaveLength(367);
    expect(days[0]).toBe('2024-01-01');
  });
});
