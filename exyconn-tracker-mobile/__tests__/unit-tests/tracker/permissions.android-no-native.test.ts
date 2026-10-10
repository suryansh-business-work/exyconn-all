import { describe, expect, it, vi } from 'vitest';
import { mobilePermissions, refreshPermissionSnapshot } from '../../../src/tracker/permissions';
import { PermissionsAndroid } from '../mocks/react-native/apis';

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<{ Platform: Record<string, unknown> }>();
  return { ...actual, Platform: { ...actual.Platform, OS: 'android' } };
});
vi.mock('../../../src/native/tracker-native', () => ({
  TrackerNative: null,
  KEEP_ALIVE_TASK: 'ExyconnTrackerKeepAlive',
}));

describe('mobilePermissions on Android without the native tracker module', () => {
  it('reports usage access as missing rather than failing, and asking for it is a no-op', async () => {
    vi.mocked(PermissionsAndroid.check).mockResolvedValue(true);
    await refreshPermissionSnapshot();

    expect(mobilePermissions.get(true)).toMatchObject({ usageAccess: false, allGranted: false });
    await expect(mobilePermissions.request('usageAccess')).resolves.toBeUndefined();
  });
});
