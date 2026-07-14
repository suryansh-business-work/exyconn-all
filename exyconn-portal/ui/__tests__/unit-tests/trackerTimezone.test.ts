import { describe, it, expect } from 'vitest';
import {
  FALLBACK_TIMEZONE,
  isValidTimezone,
  resolveTimezone,
  timezoneMeta,
  timezoneOffsetLabel,
  timezoneOptionLabel,
  timezoneSummary,
} from '../../src/pages/modules/tracker/tracker.timezone';
import {
  DEVICE_TIMEZONE_OPTION,
  buildTimezoneOptions,
} from '../../src/pages/modules/tracker/forms/tracker-settings/timezone.options';

// A winter instant, so the offsets asserted below are DST-stable.
const at = new Date('2026-01-15T12:00:00Z');

describe('isValidTimezone', () => {
  it('accepts zone names ICU only lists pre-canonicalisation', () => {
    expect(isValidTimezone('Asia/Kolkata')).toBe(true);
    expect(isValidTimezone('UTC')).toBe(true);
  });

  it('rejects empty and unresolvable names', () => {
    expect(isValidTimezone('')).toBe(false);
    expect(isValidTimezone(null)).toBe(false);
    expect(isValidTimezone(undefined)).toBe(false);
    expect(isValidTimezone('Mars/Olympus_Mons')).toBe(false);
  });
});

describe('resolveTimezone', () => {
  it("prefers the employee's own pick", () => {
    const resolved = resolveTimezone({
      employeeTimezone: 'Europe/London',
      defaultTimezone: 'Asia/Kolkata',
      deviceTimezone: 'America/New_York',
    });
    expect(resolved).toEqual({ timezone: 'Europe/London', source: 'chosen' });
  });

  it('falls back to the workspace default when the employee never picked one', () => {
    const resolved = resolveTimezone({
      employeeTimezone: '',
      defaultTimezone: 'Asia/Kolkata',
      deviceTimezone: 'America/New_York',
    });
    expect(resolved).toEqual({ timezone: 'Asia/Kolkata', source: 'workspace' });
  });

  it("falls back to the device's zone when there is no workspace default", () => {
    const resolved = resolveTimezone({
      employeeTimezone: '',
      defaultTimezone: '',
      deviceTimezone: 'America/New_York',
    });
    expect(resolved).toEqual({ timezone: 'America/New_York', source: 'device' });
  });

  it('ignores an unresolvable device zone rather than trusting the client', () => {
    const resolved = resolveTimezone({ defaultTimezone: '', deviceTimezone: 'Not/A_Zone' });
    expect(resolved).toEqual({ timezone: FALLBACK_TIMEZONE, source: 'fallback' });
  });

  it('falls back to UTC when nothing resolves', () => {
    expect(resolveTimezone({})).toEqual({ timezone: 'UTC', source: 'fallback' });
  });
});

describe('timezone labels', () => {
  it('renders the current UTC offset', () => {
    expect(timezoneOffsetLabel('Asia/Kolkata', at)).toBe('UTC+05:30');
    expect(timezoneOffsetLabel('UTC', at)).toBe('UTC+00:00');
    expect(timezoneOptionLabel('Europe/London', at)).toBe('Europe/London (UTC+00:00)');
  });

  it('explains why a zone won', () => {
    expect(timezoneMeta({ timezone: 'Asia/Kolkata', source: 'workspace' })).toBe(
      'UTC+05:30 · workspace default',
    );
    expect(timezoneSummary({ timezone: 'Asia/Kolkata', source: 'chosen' })).toBe(
      'Asia/Kolkata (UTC+05:30 · chosen)',
    );
  });
});

describe('buildTimezoneOptions', () => {
  it('leads with the explicit "device\'s own timezone" option mapped to an empty value', () => {
    const options = buildTimezoneOptions('', at);
    expect(options[0]).toEqual(DEVICE_TIMEZONE_OPTION);
    expect(options[0].value).toBe('');
  });

  it('sources zones from ICU and labels each with its offset', () => {
    const options = buildTimezoneOptions('', at);
    expect(options.length).toBeGreaterThan(100);
    const london = options.find((option) => option.value === 'Europe/London');
    expect(london?.label).toBe('Europe/London (UTC+00:00)');
  });

  it('includes the saved zone even when ICU lists it under another name', () => {
    const options = buildTimezoneOptions('Asia/Kolkata', at);
    expect(options.filter((option) => option.value === 'Asia/Kolkata')).toHaveLength(1);
  });

  it('does not inject an unresolvable saved value', () => {
    const options = buildTimezoneOptions('Mars/Olympus_Mons', at);
    expect(options.some((option) => option.value === 'Mars/Olympus_Mons')).toBe(false);
  });
});
