import { describe, expect, it } from 'vitest';
import {
  WEEK,
  meetingTypeSchema,
  slugFrom,
  toMeetingTypeValues,
  type MeetingTypeValues,
} from '../../../../../../src/pages/meetings/forms/meeting-type';
import { meetingTypeRow } from '../../meetings-fixtures';

const valid = (): MeetingTypeValues => toMeetingTypeValues(meetingTypeRow(), 'UTC');

/** The issues for the settings with `patch` applied, as "path: message" lines. */
function issues(patch: Record<string, unknown>) {
  const result = meetingTypeSchema.safeParse({ ...valid(), ...patch });
  return result.success
    ? []
    : result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
}

describe('slugFrom', () => {
  it('lower-cases a name and joins its words with single dashes', () => {
    expect(slugFrom('Intro call (30 min)')).toBe('intro-call-30-min');
    expect(slugFrom('  Café -- Demo!  ')).toBe('caf-demo');
  });

  it('stops at 60 characters', () => {
    expect(slugFrom('a'.repeat(80))).toHaveLength(60);
  });

  it('is empty for a name with nothing link-safe', () => {
    expect(slugFrom('')).toBe('');
    expect(slugFrom('!!!')).toBe('');
  });
});

describe('toMeetingTypeValues', () => {
  it('starts a new type on weekdays 9 to 5 in the given zone, open, 30 minutes long', () => {
    const values = toMeetingTypeValues(null, 'Europe/Paris');

    expect(values).toMatchObject({
      title: '',
      slug: '',
      description: '',
      durationMinutes: 30,
      location: '',
      timezone: 'Europe/Paris',
      bufferMinutes: 0,
      minNoticeHours: 4,
      maxDaysAhead: 30,
      active: true,
    });
    expect(values.weeklyHours.map((hours) => [hours.day, hours.enabled])).toEqual([
      [1, true],
      [2, true],
      [3, true],
      [4, true],
      [5, true],
      [6, false],
      [0, false],
    ]);
    expect(values.weeklyHours.every((h) => h.start === '09:00' && h.end === '17:00')).toBe(true);
  });

  it('fills a saved type Monday first, with days it never saved off at 9 to 5', () => {
    const row = meetingTypeRow({
      weeklyHours: [
        { day: 0, enabled: true, start: '11:00', end: '13:00' },
        { day: 3, enabled: false, start: '10:00', end: '12:00' },
      ],
    });

    const values = toMeetingTypeValues(row, 'UTC');

    expect(values.timezone).toBe('Asia/Kolkata');
    expect(values.weeklyHours.map((h) => h.day)).toEqual(WEEK.map((w) => w.day));
    expect(values.weeklyHours[2]).toEqual({ day: 3, enabled: false, start: '10:00', end: '12:00' });
    expect(values.weeklyHours[6]).toEqual({ day: 0, enabled: true, start: '11:00', end: '13:00' });
    expect(values.weeklyHours[0]).toEqual({ day: 1, enabled: false, start: '09:00', end: '17:00' });
    expect(values).toMatchObject({ bufferMinutes: 15, minNoticeHours: 2, maxDaysAhead: 60 });
  });
});

describe('meetingTypeSchema', () => {
  it('accepts a saved type and reads numbers typed as text', () => {
    expect(issues({})).toEqual([]);
    expect(meetingTypeSchema.parse({ ...valid(), durationMinutes: '45' }).durationMinutes).toBe(45);
  });

  it('wants a name and a link-safe link of 3 to 60 characters', () => {
    expect(issues({ title: '  ' })).toEqual(['title: Give the meeting a name']);
    expect(issues({ title: 'x'.repeat(121) })).toEqual(['title: Keep the name under 120 characters']);
    expect(issues({ slug: 'ab' })).toEqual(['slug: Use at least 3 characters']);
    expect(issues({ slug: 'a'.repeat(61) })).toEqual(['slug: Keep the link under 60 characters']);
    expect(issues({ slug: 'Intro Call' })).toEqual([
      'slug: Use lower-case letters, digits and dashes',
    ]);
  });

  it('keeps the lengths, rules and text within their bounds', () => {
    expect(issues({ durationMinutes: 4 })).toEqual(['durationMinutes: Between 5 and 480 minutes']);
    expect(issues({ durationMinutes: 480 })).toEqual([]);
    expect(issues({ durationMinutes: 30.5 })).toEqual([
      'durationMinutes: Between 5 and 480 minutes',
    ]);
    expect(issues({ bufferMinutes: 241 })).toEqual(['bufferMinutes: Between 0 and 240 minutes']);
    expect(issues({ minNoticeHours: -1 })).toEqual(['minNoticeHours: Between 0 and 720 hours']);
    expect(issues({ maxDaysAhead: 0 })).toEqual(['maxDaysAhead: Between 1 and 365 days']);
    expect(issues({ description: 'x'.repeat(2001) })).toEqual([
      'description: Keep the description under 2000 characters',
    ]);
    expect(issues({ location: 'x'.repeat(501) })).toEqual([
      'location: Keep the location under 500 characters',
    ]);
    expect(issues({ timezone: ' ' })).toEqual(['timezone: Pick a time zone']);
  });

  it('wants an available day to end after it starts, ignoring days that are off', () => {
    const hours = valid().weeklyHours;
    const late = hours.map((h, i) => (i === 0 ? { ...h, start: '17:00', end: '09:00' } : h));
    const blank = hours.map((h, i) => (i === 1 ? { ...h, end: '' } : h));
    const noStart = hours.map((h, i) => (i === 2 ? { ...h, start: '' } : h));
    const offAndBackwards = hours.map((h, i) =>
      i === 5 ? { ...h, enabled: false, start: '17:00', end: '09:00' } : h,
    );

    expect(issues({ weeklyHours: late })).toEqual(['weeklyHours.0.end: End after the start']);
    expect(issues({ weeklyHours: blank })).toEqual(['weeklyHours.1.end: End after the start']);
    expect(issues({ weeklyHours: noStart })).toEqual(['weeklyHours.2.end: End after the start']);
    expect(issues({ weeklyHours: offAndBackwards })).toEqual([]);
  });

  it('wants at least one day available', () => {
    const allOff = valid().weeklyHours.map((h) => ({ ...h, enabled: false }));

    expect(issues({ weeklyHours: allOff })).toEqual(['weeklyHours: Make at least one day available']);
  });
});
