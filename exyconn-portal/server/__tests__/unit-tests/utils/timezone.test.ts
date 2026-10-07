import {
  FALLBACK_TIMEZONE,
  isValidTimezone,
  resolveEffectiveTimezone,
  supportedTimezones,
} from '../../../src/utils/timezone';

describe('isValidTimezone', () => {
  it.each(['Asia/Kolkata', 'Asia/Calcutta', 'Europe/Berlin', 'UTC'])('accepts %s', (zone) => {
    expect(isValidTimezone(zone)).toBe(true);
  });

  it.each([['Mars/Olympus_Mons'], ['not a zone'], [''], [null], [undefined]])(
    'rejects %p',
    (zone) => {
      expect(isValidTimezone(zone)).toBe(false);
    },
  );
});

describe('supportedTimezones', () => {
  it('lists every resolvable zone once, sorted, with UTC added', () => {
    const zones = supportedTimezones();
    expect(zones).toContain(FALLBACK_TIMEZONE);
    expect(zones).toContain('Europe/Berlin');
    expect(new Set(zones).size).toBe(zones.length);
    expect(zones).toEqual([...zones].sort((a, b) => a.localeCompare(b)));
  });
});

describe('resolveEffectiveTimezone', () => {
  it('prefers the zone the person picked', () => {
    expect(
      resolveEffectiveTimezone({
        employeeTimezone: 'Asia/Kolkata',
        defaultTimezone: 'Europe/Berlin',
        deviceTimezone: 'America/New_York',
      }),
    ).toBe('Asia/Kolkata');
  });

  it('falls back to the workspace default, then the device zone', () => {
    expect(
      resolveEffectiveTimezone({ employeeTimezone: null, defaultTimezone: 'Europe/Berlin' }),
    ).toBe('Europe/Berlin');
    expect(resolveEffectiveTimezone({ deviceTimezone: 'America/New_York' })).toBe(
      'America/New_York',
    );
  });

  it('skips a candidate that does not resolve, so a bad device zone cannot win', () => {
    expect(
      resolveEffectiveTimezone({
        employeeTimezone: 'Nowhere/Land',
        defaultTimezone: '',
        deviceTimezone: 'Asia/Tokyo',
      }),
    ).toBe('Asia/Tokyo');
  });

  it('answers UTC when nothing resolves', () => {
    expect(resolveEffectiveTimezone({})).toBe(FALLBACK_TIMEZONE);
    expect(resolveEffectiveTimezone({ deviceTimezone: 'garbage' })).toBe('UTC');
  });
});
