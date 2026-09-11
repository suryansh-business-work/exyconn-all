import { describe, expect, it } from 'vitest';
import { missingPermissions } from '../../../src/lib/permissions/permission-rows';
import type { Capabilities, MobilePermissions } from '../../../src/tracker/types';

const ANDROID: Capabilities = {
  screenshots: true,
  foregroundApp: true,
  inputCounts: false,
  webcam: true,
  background: true,
};
const IPHONE: Capabilities = {
  ...ANDROID,
  screenshots: false,
  foregroundApp: false,
  webcam: false,
  background: false,
};

function grants(overrides: Partial<MobilePermissions>): MobilePermissions {
  return { notifications: true, usageAccess: true, camera: true, allGranted: true, ...overrides };
}

describe('missingPermissions', () => {
  it('lists nothing once everything is granted', () => {
    expect(missingPermissions(grants({}), ANDROID)).toEqual([]);
  });

  it('lists only what is missing, notifications first', () => {
    const missing = missingPermissions(
      grants({ notifications: false, camera: false, allGranted: false }),
      ANDROID,
    );
    expect(missing.map((row) => row.kind)).toEqual(['notifications', 'camera']);
  });

  it('sends usage access to Settings, and says it never sees what is on screen', () => {
    const [usage] = missingPermissions(grants({ usageAccess: false }), ANDROID);
    expect(usage.actionLabel).toBe('Open Settings');
    expect(usage.reason).toContain('never what is on it');
  });

  it('explains notifications by the captures they announce on Android', () => {
    const [row] = missingPermissions(grants({ notifications: false }), ANDROID);
    expect(row.reason).toContain('Every screenshot is announced');
  });

  it('does not promise screenshot announcements on a phone that takes none', () => {
    const [row] = missingPermissions(grants({ notifications: false }), IPHONE);
    expect(row.reason).not.toContain('screenshot');
    expect(row.actionLabel).toBe('Allow');
  });
});
