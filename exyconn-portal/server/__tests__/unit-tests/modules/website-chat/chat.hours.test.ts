import { isWithinHours, type ChatDay } from '../../../../src/modules/website-chat/chat.hours';

/** Monday 5 October 2026 at hh:mm UTC. */
const monday = (hhmm: string) => new Date(`2026-10-05T${hhmm}:00Z`);

const week = (overrides: Partial<ChatDay>[] = []): ChatDay[] =>
  [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    enabled: day !== 0 && day !== 6,
    start: '09:00',
    end: '18:00',
    ...overrides.find((o) => o.day === day),
  }));

describe('isWithinHours', () => {
  it('is on duty from the opening minute up to, not including, the closing minute', () => {
    const hours = { timezone: 'UTC', weeklyHours: week() };
    expect(isWithinHours(hours, monday('08:59'))).toBe(false);
    expect(isWithinHours(hours, monday('09:00'))).toBe(true);
    expect(isWithinHours(hours, monday('17:59'))).toBe(true);
    expect(isWithinHours(hours, monday('18:00'))).toBe(false);
  });

  it('is off duty on a disabled day even inside its hours', () => {
    const hours = { timezone: 'UTC', weeklyHours: week([{ day: 1, enabled: false }]) };
    expect(isWithinHours(hours, monday('12:00'))).toBe(false);
  });

  it('reads the clock in the settings timezone', () => {
    // 04:00 UTC is 09:30 in Kolkata (UTC+05:30): open there, closed in UTC.
    const weeklyHours = week();
    expect(isWithinHours({ timezone: 'Asia/Kolkata', weeklyHours }, monday('04:00'))).toBe(true);
    expect(isWithinHours({ timezone: 'UTC', weeklyHours }, monday('04:00'))).toBe(false);
  });

  it('runs a day whose end is before its start past midnight into the next day', () => {
    // Sunday 22:00 to 02:00 covers late Sunday and early Monday, nothing else.
    const hours = {
      timezone: 'UTC',
      weeklyHours: week([
        { day: 0, enabled: true, start: '22:00', end: '02:00' },
        { day: 1, enabled: false },
      ]),
    };
    expect(isWithinHours(hours, new Date('2026-10-04T23:30:00Z'))).toBe(true);
    expect(isWithinHours(hours, new Date('2026-10-04T21:59:00Z'))).toBe(false);
    expect(isWithinHours(hours, monday('01:59'))).toBe(true);
    expect(isWithinHours(hours, monday('02:00'))).toBe(false);
  });

  it('wraps Saturday night hours into Sunday morning', () => {
    const hours = {
      timezone: 'UTC',
      weeklyHours: week([{ day: 6, enabled: true, start: '20:00', end: '03:00' }]),
    };
    // Sunday 4 October 2026, 01:00 UTC — yesterday (Saturday) is day 6.
    expect(isWithinHours(hours, new Date('2026-10-04T01:00:00Z'))).toBe(true);
  });

  it('treats a missing minutes part as on the hour', () => {
    const hours = { timezone: 'UTC', weeklyHours: week([{ day: 1, start: '10', end: '11' }]) };
    expect(isWithinHours(hours, monday('10:30'))).toBe(true);
    expect(isWithinHours(hours, monday('09:59'))).toBe(false);
  });

  it('defaults to the current moment', () => {
    const allDay = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      day,
      enabled: true,
      start: '00:00',
      end: '00:00',
    }));
    // A start equal to its end wraps the whole day, so it is always on duty.
    expect(isWithinHours({ timezone: 'UTC', weeklyHours: allDay })).toBe(true);
    expect(isWithinHours({ timezone: 'UTC', weeklyHours: [] })).toBe(false);
  });
});
