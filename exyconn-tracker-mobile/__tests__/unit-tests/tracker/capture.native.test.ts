import { overlayRect, type ComposeInput } from '@exyconn/tracker-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { announceCapture, composeWithWebcam } from '../../../src/tracker/capture';
import { cameraGranted } from '../../../src/tracker/permissions';
import { settings } from '../dashboard/fixtures';
import { captureReport } from './capture-fixtures';

const native = vi.hoisted(() => ({
  showCaptureNotification: vi.fn(),
  takeWebcamPhoto: vi.fn(),
  composeWebcam: vi.fn(),
}));

vi.mock('../../../src/native/tracker-native', () => ({
  TrackerNative: native,
  KEEP_ALIVE_TASK: 'ExyconnTrackerKeepAlive',
}));
vi.mock('../../../src/tracker/permissions', () => ({ cameraGranted: vi.fn() }));
vi.mock('../../../src/tracker/platform', () => ({
  lastCaptureDimensions: () => ({ width: 1080, height: 2400 }),
}));

const INPUT: ComposeInput = {
  screen: 'screen-base64',
  mimeType: 'image/jpeg',
  corner: 'bottom-right',
  quality: 70,
};

describe('announceCapture on Android', () => {
  it('shows the capture itself, with the shutter, and deep-links to its day', () => {
    announceCapture(captureReport(), settings({ captureSoundEnabled: true }), false);
    expect(native.showCaptureNotification).toHaveBeenCalledWith({
      title: 'Exyconn Tracker — Screenshot captured',
      body: 'Worked 45m · 75% active\nIn Slack\nTap to open it',
      image: 'base64-preview',
      mimeType: 'image/png',
      silent: false,
      url: 'exyconntracker://screenshots?capturedAt=2026-09-11T10%3A15%3A00.000Z',
    });
  });

  it('is silent when this phone is muted, or the workspace turned the sound off', () => {
    announceCapture(captureReport(), settings({ captureSoundEnabled: true }), true);
    announceCapture(captureReport(), settings({ captureSoundEnabled: false }), false);
    const calls = native.showCaptureNotification.mock.calls.map(([options]) => options.silent);
    expect(calls).toEqual([true, true]);
  });

  it('plays the shutter before the workspace settings load, and assumes JPEG', () => {
    announceCapture(captureReport({ previewMimeType: undefined }), null, false);
    expect(native.showCaptureNotification).toHaveBeenCalledWith(
      expect.objectContaining({ silent: false, mimeType: 'image/jpeg' }),
    );
  });

  it('announces nothing for a capture that produced no preview', () => {
    announceCapture(captureReport({ preview: undefined }), null, false);
    expect(native.showCaptureNotification).not.toHaveBeenCalled();
  });
});

describe('composeWithWebcam on Android', () => {
  beforeEach(() => {
    vi.mocked(cameraGranted).mockReturnValue(true);
  });

  it('takes no photo without the camera grant', async () => {
    vi.mocked(cameraGranted).mockReturnValue(false);
    await expect(composeWithWebcam(INPUT)).resolves.toBeNull();
    expect(native.takeWebcamPhoto).not.toHaveBeenCalled();
  });

  it('uploads the plain screenshot, and says why, when the camera fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    native.takeWebcamPhoto.mockResolvedValue(null);
    await expect(composeWithWebcam(INPUT)).resolves.toBeNull();
    expect(error).toHaveBeenCalledWith(
      'Webcam photo unavailable; uploading the screenshot without one',
    );
    expect(native.composeWebcam).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('places the photo in the workspace’s corner of the last capture', async () => {
    native.takeWebcamPhoto.mockResolvedValue({ base64: 'photo-base64', width: 480, height: 640 });
    native.composeWebcam.mockResolvedValue('composed-base64');
    await expect(composeWithWebcam(INPUT)).resolves.toBe('composed-base64');
    expect(native.composeWebcam).toHaveBeenCalledWith({
      screen: 'screen-base64',
      mimeType: 'image/jpeg',
      photo: 'photo-base64',
      rect: overlayRect('bottom-right', { width: 1080, height: 2400 }, 480 / 640),
      quality: 70,
    });
  });
});
