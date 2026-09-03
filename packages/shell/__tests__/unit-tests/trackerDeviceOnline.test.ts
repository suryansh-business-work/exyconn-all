import { describe, it, expect } from 'vitest';
import { isDeviceOnline } from '@/pages/tracker-view/tracker.format';

const NOW = new Date('2026-09-04T10:00:00.000Z');

/** Minutes before NOW, as the ISO string the portal serves for lastSeenAt. */
function minutesAgo(minutes: number): string {
  return new Date(NOW.getTime() - minutes * 60_000).toISOString();
}

describe('isDeviceOnline', () => {
  it('counts a device that just checked in', () => {
    expect(isDeviceOnline(minutesAgo(0), NOW)).toBe(true);
  });

  it('tolerates one missed heartbeat, so a dropped request is not "offline"', () => {
    expect(isDeviceOnline(minutesAgo(2), NOW)).toBe(true);
  });

  it('drops a device that has stopped checking in', () => {
    expect(isDeviceOnline(minutesAgo(5), NOW)).toBe(false);
    expect(isDeviceOnline(minutesAgo(60), NOW)).toBe(false);
  });

  it('is not fooled by an unparseable timestamp', () => {
    expect(isDeviceOnline('not-a-date', NOW)).toBe(false);
  });
});
