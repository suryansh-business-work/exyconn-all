// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { PermissionKind, PermissionState } from '@shared/types';
import PermissionsScreen from '../../../../src/renderer/screens/PermissionsScreen';
import {
  buttonNamed,
  cleanup,
  errorText,
  finish,
  installDomShims,
  mount,
  overrideTracker,
  pressButton,
  trackerState,
} from '../../test-utils';

beforeAll(installDomShims);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const NONE: PermissionState = {
  screenRecording: false,
  accessibility: false,
  camera: false,
  allGranted: false,
};

async function open(permissions: PermissionState): Promise<void> {
  await mount(<PermissionsScreen permissions={permissions} />, trackerState('idle'));
}

function grantButtons(): HTMLButtonElement[] {
  return [...document.querySelectorAll<HTMLButtonElement>('button')].filter(
    (node) => node.textContent?.trim() === 'Grant',
  );
}

/** An error that carries no text, so the screen has to fall back to its own words. */
const NO_MESSAGE = '';

describe('PermissionsScreen rows', () => {
  it('asks only for what is still missing, the camera included when it is', async () => {
    await open(NONE);
    const text = document.body.textContent ?? '';
    expect(text).toContain('Screen Recording');
    expect(text).toContain('Accessibility');
    expect(text).toContain('Camera');
    expect(grantButtons()).toHaveLength(3);
  });

  it('leaves out a permission that is already granted', async () => {
    await open({ ...NONE, screenRecording: true, camera: true });
    expect(document.body.textContent).not.toContain('Screen Recording');
    expect(document.body.textContent).not.toContain('Camera');
    expect(grantButtons()).toHaveLength(1);
  });

  it('asks macOS for exactly the row that was pressed', async () => {
    await open({ ...NONE, accessibility: true });
    const requestPermission = vi.fn((_kind: PermissionKind) => Promise.resolve());
    overrideTracker({ requestPermission });
    await pressButton(grantButtons()[1]);
    await finish(() => undefined);
    expect(requestPermission).toHaveBeenCalledWith('camera');
  });

  it('says what to do when macOS gives no answer', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await open({ ...NONE, accessibility: true, camera: true });
    overrideTracker({ requestPermission: () => Promise.reject(new Error(NO_MESSAGE)) });
    await pressButton(buttonNamed('Grant'));
    await finish(() => undefined);
    expect(errorText()).toBe(
      'macOS did not answer the request. Try again, or allow it in System Settings.',
    );
  });

  it('shows the controller’s own reason, without Electron’s wrapper', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await open({ ...NONE, accessibility: true, camera: true });
    overrideTracker({
      getPermissions: () =>
        Promise.reject(
          new Error("Error invoking remote method 'tracker:get-permissions': Error: Not on macOS"),
        ),
    });
    await pressButton(buttonNamed('Re-check'));
    await finish(() => undefined);
    expect(errorText()).toBe('Not on macOS');
  });
});
