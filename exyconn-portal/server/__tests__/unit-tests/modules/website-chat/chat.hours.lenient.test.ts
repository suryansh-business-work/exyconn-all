import { isWithinHours, type ChatDay } from '../../../../src/modules/website-chat/chat.hours';

const week = (start: string, end: string): ChatDay[] =>
  [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, enabled: true, start, end }));

describe('isWithinHours with opening times written as a bare hour', () => {
  it('reads "09" as nine on the hour', () => {
    const hours = { timezone: 'UTC', weeklyHours: week('09', '18') };

    expect(isWithinHours(hours, new Date('2026-10-05T08:59:00Z'))).toBe(false);
    expect(isWithinHours(hours, new Date('2026-10-05T09:00:00Z'))).toBe(true);
    expect(isWithinHours(hours, new Date('2026-10-05T18:00:00Z'))).toBe(false);
  });
});
