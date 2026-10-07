import { MAX_CAPTURE_BYTES } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import {
  CAPTURE_DECLINED,
  androidDeps,
  lastCaptureDimensions,
} from '../../../../src/tracker/platform/android';
import { settings } from '../../dashboard/fixtures';
import { fakeContext, fakeNative } from './android-fixtures';

vi.mock('../../../../src/tracker/platform/shared', () => ({
  baseDeps: () => ({ portal: 'portal', outbox: 'outbox', input: 'input' }),
}));
vi.mock('../../../../src/tracker/keep-alive', () => ({ releaseKeepAlive: vi.fn() }));
vi.mock('../../../../src/tracker/permissions', () => ({ cameraGranted: vi.fn(() => true) }));

describe('androidDeps', () => {
  it('builds on the shared portal, outbox and input counter', () => {
    const deps = androidDeps(fakeNative().native, fakeContext().context);
    expect(deps).toMatchObject({ portal: 'portal', outbox: 'outbox', input: 'input' });
  });

  it('reads idle time from the screen and lock state', () => {
    const { spies, native } = fakeNative();
    expect(androidDeps(native, fakeContext().context).idleSeconds()).toBe(12);
    expect(spies.getIdleSeconds).toHaveBeenCalledTimes(1);
  });

  it('samples the app in front by name, with no window titles', async () => {
    const { spies, native } = fakeNative();
    const { foreground } = androidDeps(native, fakeContext().context);
    spies.getForegroundApp.mockReturnValue({ packageName: 'com.chrome', label: 'Chrome' });
    await expect(foreground.sample(1_000)).resolves.toBe('Chrome');
    spies.getForegroundApp.mockReturnValue({ packageName: 'com.slack', label: 'Slack' });
    await foreground.sample(2_000);
    expect(foreground.drain(4_000, true)).toEqual([
      { appName: 'Chrome', windowTitle: '', durationMs: 1_000 },
      { appName: 'Slack', windowTitle: '', durationMs: 2_000 },
    ]);
  });

  it('samples an empty name without usage access', async () => {
    const { foreground } = androidDeps(fakeNative().native, fakeContext().context);
    await expect(foreground.sample(0)).resolves.toBe('');
  });
});

describe('screen capture', () => {
  it('has taken nothing before the first capture', () => {
    expect(lastCaptureDimensions()).toEqual({ width: 0, height: 0 });
  });

  it('encodes one JPEG at the workspace quality, scaled to its max width', async () => {
    const { spies, native } = fakeNative();
    const deps = androidDeps(native, fakeContext().context);
    const shots = await deps.capture(settings({ screenshotQuality: 80, screenshotMaxWidth: 960 }));
    expect(spies.captureScreen).toHaveBeenCalledWith({
      lossless: false,
      quality: 80,
      targetWidth: 960,
      blurWidth: null,
      maxBytes: MAX_CAPTURE_BYTES,
    });
    expect(shots).toEqual([
      { image: 'shot-base64', mimeType: 'image/jpeg', displayId: '0', blurred: false },
    ]);
    expect(lastCaptureDimensions()).toEqual({ width: 1080, height: 2400 });
  });

  it('pixelates from the scaled width when the workspace blurs', async () => {
    const { spies, native } = fakeNative();
    const deps = androidDeps(native, fakeContext().context);
    const shots = await deps.capture(
      settings({ screenshotQuality: 80, screenshotMaxWidth: 960, blurScreenshots: true }),
    );
    expect(spies.captureScreen).toHaveBeenCalledWith(expect.objectContaining({ blurWidth: 80 }));
    expect(shots[0].blurred).toBe(true);
  });

  it('keeps native resolution at quality 100, blurring from the screen’s own width', async () => {
    const { spies, native } = fakeNative();
    const deps = androidDeps(native, fakeContext().context);
    await deps.capture(settings({ screenshotQuality: 100, blurScreenshots: true }));
    expect(spies.captureScreen).toHaveBeenCalledWith(
      expect.objectContaining({ lossless: true, targetWidth: null, blurWidth: 98 }),
    );
  });

  it('returns nothing when the native side had no frame to encode', async () => {
    const { spies, native } = fakeNative();
    spies.captureScreen.mockResolvedValue(null);
    await expect(androidDeps(native, fakeContext().context).capture(settings())).resolves.toEqual(
      [],
    );
  });

  it('pauses the session when the capture grant has gone', async () => {
    const { spies, native } = fakeNative();
    const { context, onCaptureLost } = fakeContext();
    spies.hasScreenCapture.mockReturnValue(false);
    await expect(androidDeps(native, context).capture(settings())).resolves.toEqual([]);
    expect(onCaptureLost).toHaveBeenCalledTimes(1);
    expect(spies.captureScreen).not.toHaveBeenCalled();
  });

  it('explains a declined capture in the employee’s terms', () => {
    expect(CAPTURE_DECLINED).toContain('tracking needs screen capture');
  });
});
