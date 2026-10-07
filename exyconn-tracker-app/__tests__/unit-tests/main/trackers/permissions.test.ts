import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { prefs, openExternal } = vi.hoisted(() => ({
  prefs: {
    getMediaAccessStatus: vi.fn((_kind: string) => 'granted'),
    isTrustedAccessibilityClient: vi.fn((_prompt: boolean) => true),
    askForMediaAccess: vi.fn((_kind: string) => Promise.resolve(true)),
  },
  openExternal: vi.fn((_url: string) => Promise.resolve()),
}));

vi.mock('electron', () => ({ systemPreferences: prefs, shell: { openExternal } }));

const realPlatform = process.platform;

/** `isMac` is decided at import, so each platform loads the module afresh. */
async function on(platform: NodeJS.Platform) {
  Object.defineProperty(process, 'platform', { value: platform, configurable: true });
  vi.resetModules();
  return import('../../../../src/main/trackers/permissions');
}

const SCREEN_PANE = 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture';
const CAMERA_PANE = 'x-apple.systempreferences:com.apple.preference.security?Privacy_Camera';

beforeEach(() => {
  prefs.getMediaAccessStatus.mockReset().mockReturnValue('granted');
  prefs.isTrustedAccessibilityClient.mockReset().mockReturnValue(true);
  prefs.askForMediaAccess.mockReset().mockResolvedValue(true);
  openExternal.mockClear();
});

afterEach(() => {
  Object.defineProperty(process, 'platform', { value: realPlatform, configurable: true });
});

describe('off macOS', () => {
  it('reports everything granted and never prompts', async () => {
    const { getPermissions, requestPermission } = await on('win32');

    expect(getPermissions(true)).toEqual({
      screenRecording: true,
      accessibility: true,
      camera: true,
      allGranted: true,
    });
    await requestPermission('screenRecording');
    expect(prefs.getMediaAccessStatus).not.toHaveBeenCalled();
    expect(openExternal).not.toHaveBeenCalled();
  });
});

describe('getPermissions on macOS', () => {
  it('is all granted when every toggle is on', async () => {
    const { getPermissions } = await on('darwin');

    expect(getPermissions(true).allGranted).toBe(true);
    expect(prefs.isTrustedAccessibilityClient).toHaveBeenCalledWith(false);
  });

  it('reports a missing screen recording or accessibility grant', async () => {
    const { getPermissions } = await on('darwin');
    prefs.getMediaAccessStatus.mockImplementation((kind) =>
      kind === 'screen' ? 'denied' : 'granted',
    );
    prefs.isTrustedAccessibilityClient.mockReturnValue(false);

    expect(getPermissions()).toEqual({
      screenRecording: false,
      accessibility: false,
      camera: true,
      allGranted: false,
    });
  });

  it('only asks about the camera when a webcam photo will be taken', async () => {
    const { getPermissions } = await on('darwin');
    prefs.getMediaAccessStatus.mockImplementation((kind) =>
      kind === 'camera' ? 'denied' : 'granted',
    );

    expect(getPermissions(false)).toMatchObject({ camera: true, allGranted: true });
    expect(getPermissions(true)).toMatchObject({ camera: false, allGranted: false });
  });
});

describe('requestPermission on macOS', () => {
  it('shows the system prompt for accessibility', async () => {
    const { requestPermission } = await on('darwin');

    await requestPermission('accessibility');

    expect(prefs.isTrustedAccessibilityClient).toHaveBeenCalledWith(true);
    expect(openExternal).not.toHaveBeenCalled();
  });

  it('asks for the camera, and opens its pane only when it was refused', async () => {
    const { requestPermission } = await on('darwin');

    await requestPermission('camera');
    expect(prefs.askForMediaAccess).toHaveBeenCalledWith('camera');
    expect(openExternal).not.toHaveBeenCalled();

    prefs.askForMediaAccess.mockResolvedValue(false);
    await requestPermission('camera');
    expect(openExternal).toHaveBeenCalledWith(CAMERA_PANE);
  });

  it('opens the Screen Recording pane, which has no prompt API', async () => {
    const { requestPermission } = await on('darwin');

    await requestPermission('screenRecording');

    expect(openExternal).toHaveBeenCalledWith(SCREEN_PANE);
  });
});
