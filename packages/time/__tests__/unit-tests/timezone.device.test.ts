import { afterEach, describe, expect, it, vi } from 'vitest';
import { FALLBACK_TIMEZONE, deviceTimezone } from '../../src/timezone';

/** Make the runtime report `zone` as the machine's own timezone. */
function reportDeviceZone(zone: string): void {
  const real = Intl.DateTimeFormat.prototype.resolvedOptions;
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockImplementation(function (
    this: Intl.DateTimeFormat,
  ) {
    return { ...real.call(this), timeZone: zone };
  });
}

describe('deviceTimezone', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the zone the machine reports when it resolves', () => {
    reportDeviceZone('Asia/Kolkata');

    expect(deviceTimezone()).toBe('Asia/Kolkata');
  });

  it('keeps a canonical zone the platform list omits, such as UTC', () => {
    reportDeviceZone('UTC');

    expect(deviceTimezone()).toBe('UTC');
  });

  it('falls back to UTC when the machine reports an unresolvable zone', () => {
    reportDeviceZone('Mars/Base');

    expect(deviceTimezone()).toBe(FALLBACK_TIMEZONE);
  });

  it('falls back to UTC when the machine reports no zone at all', () => {
    reportDeviceZone('');

    expect(deviceTimezone()).toBe(FALLBACK_TIMEZONE);
  });

  it('matches the real runtime zone when nothing is stubbed', () => {
    const reported = Intl.DateTimeFormat().resolvedOptions().timeZone;

    expect(deviceTimezone()).toBe(reported);
  });
});
