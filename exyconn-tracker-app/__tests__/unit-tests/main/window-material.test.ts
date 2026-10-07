import { afterEach, describe, expect, it } from 'vitest';
import { neutral } from '../../../../packages/ui/src/tokens/colors.tokens';
import { wantsTransparency, windowGroundOptions } from '../../../src/main/window-material';

const realPlatform = process.platform;
const realGetSystemVersion = Object.getOwnPropertyDescriptor(process, 'getSystemVersion');

/** Pretends to be another OS: Electron's `process.getSystemVersion` does not exist under node. */
function runningOn(platform: NodeJS.Platform, systemVersion = ''): void {
  Object.defineProperty(process, 'platform', { value: platform, configurable: true });
  Object.defineProperty(process, 'getSystemVersion', {
    value: () => systemVersion,
    configurable: true,
  });
}

afterEach(() => {
  Object.defineProperty(process, 'platform', { value: realPlatform, configurable: true });
  if (realGetSystemVersion === undefined) {
    Reflect.deleteProperty(process, 'getSystemVersion');
  } else {
    Object.defineProperty(process, 'getSystemVersion', realGetSystemVersion);
  }
});

describe('wantsTransparency', () => {
  it('stays solid when the employee has not asked for see-through', () => {
    runningOn('darwin', '14.5.0');

    expect(wantsTransparency(false)).toBe(false);
  });

  it('goes see-through on macOS and on Windows 11 22H2 or later', () => {
    runningOn('darwin', '14.5.0');
    expect(wantsTransparency(true)).toBe(true);

    runningOn('win32', '10.0.22631');
    expect(wantsTransparency(true)).toBe(true);
  });

  it('stays solid where the OS cannot frost the window', () => {
    runningOn('win32', '10.0.19045');
    expect(wantsTransparency(true)).toBe(false);

    runningOn('linux', '6.8.0');
    expect(wantsTransparency(true)).toBe(false);
  });
});

describe('windowGroundOptions', () => {
  it('paints a solid window the dark neutral ground', () => {
    expect(windowGroundOptions(false)).toEqual({ backgroundColor: neutral[900] });
  });

  it('builds a clear window frosted with vibrancy on macOS', () => {
    runningOn('darwin');

    expect(windowGroundOptions(true)).toEqual({
      transparent: true,
      backgroundColor: '#00000000',
      vibrancy: 'under-window',
      visualEffectState: 'active',
    });
  });

  it('builds a clear window frosted with acrylic on Windows', () => {
    runningOn('win32');

    expect(windowGroundOptions(true)).toEqual({
      transparent: true,
      backgroundColor: '#00000000',
      backgroundMaterial: 'acrylic',
    });
  });
});
