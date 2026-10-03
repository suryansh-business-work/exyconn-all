// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import PermissionsScreen from './PermissionsScreen';
import { trackerState } from '../a11y/tracker-fixture';
import { cleanup, installDomShims, mount } from '../a11y/render-harness';
import {
  buttonNamed,
  deferred,
  errorText,
  finish,
  isLoading,
  overrideTracker,
  press,
} from '../a11y/component-harness';

beforeAll(installDomShims);
afterEach(cleanup);

const permissions = {
  screenRecording: false,
  accessibility: true,
  camera: true,
  allGranted: false,
};

describe('PermissionsScreen', () => {
  it('spins on the grant being asked for and holds Re-check until macOS answers', async () => {
    await mount(<PermissionsScreen permissions={permissions} />, trackerState('idle'));
    const asking = deferred();
    overrideTracker({ requestPermission: () => asking.promise });

    await press(buttonNamed('Grant'));
    expect(isLoading(buttonNamed('Grant'))).toBe(true);
    expect(buttonNamed('Re-check').disabled).toBe(true);

    await finish(asking.resolve);
    expect(isLoading(buttonNamed('Grant'))).toBe(false);
    expect(errorText()).toBeUndefined();
  });

  it('spins on Re-check, and says so when it fails', async () => {
    await mount(<PermissionsScreen permissions={permissions} />, trackerState('idle'));
    const checking = deferred();
    overrideTracker({ getPermissions: () => checking.promise });

    await press(buttonNamed('Re-check'));
    expect(isLoading(buttonNamed('Re-check'))).toBe(true);

    await finish(() => checking.reject(new Error('')));
    expect(errorText()).toBe('Could not re-check the permissions. Try again.');
  });
});
