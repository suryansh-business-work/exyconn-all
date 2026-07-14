import { describe, it, expect } from 'vitest';
import { deviceTimezone, effectiveTimezone, isValidTimezone } from './timezone';

describe('isValidTimezone', () => {
  it('accepts the zones the portal accepts, including the two ICU leaves out of its own list', () => {
    // `Intl.supportedValuesOf('timeZone')` is the PRE-canonicalisation list: it carries
    // `Asia/Calcutta` but not `Asia/Kolkata`, and no `UTC` at all. A membership check against
    // it would reject both of these — which is why this is an Intl.DateTimeFormat probe, and
    // why it agrees with the portal (which validates the same way).
    expect(isValidTimezone('Asia/Kolkata')).toBe(true);
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('America/New_York')).toBe(true);
    expect(isValidTimezone('Europe/London')).toBe(true);
  });

  it('rejects a name no runtime can resolve, and the empty "never picked" value', () => {
    expect(isValidTimezone('Mars/Olympus_Mons')).toBe(false);
    expect(isValidTimezone('not a zone')).toBe(false);
    expect(isValidTimezone('')).toBe(false);
  });
});

describe('deviceTimezone', () => {
  it('always resolves to a zone that can actually format a date', () => {
    expect(isValidTimezone(deviceTimezone())).toBe(true);
  });
});

describe('effectiveTimezone', () => {
  it('uses the zone the portal resolved for this employee', () => {
    // The portal has already applied the chain (their pick → the admin default → the device's
    // reported zone). Whatever it hands back is what the app renders in.
    expect(effectiveTimezone('Asia/Kolkata')).toBe('Asia/Kolkata');
    expect(effectiveTimezone('UTC')).toBe('UTC');
  });

  it('falls back to this device when nobody has picked a zone', () => {
    // '' is the portal's meaningful "not set" value — it is not an error, and it must not
    // reach date-fns-tz, where it would throw on every timestamp in the UI.
    expect(effectiveTimezone('')).toBe(deviceTimezone());
    expect(effectiveTimezone(null)).toBe(deviceTimezone());
    expect(effectiveTimezone(undefined)).toBe(deviceTimezone());
  });

  it('falls back rather than trusting a zone this runtime cannot resolve', () => {
    // The zone arrives over the network and is only as good as whatever the portal stored.
    // Rendering nothing at all beats taking every screen in the app down with a throw.
    expect(effectiveTimezone('Mars/Olympus_Mons')).toBe(deviceTimezone());
  });
});
