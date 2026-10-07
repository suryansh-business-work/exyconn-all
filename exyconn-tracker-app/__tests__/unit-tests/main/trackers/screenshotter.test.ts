import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_CAPTURE_BYTES } from '@exyconn/tracker-core';
import type { TrackerSettings } from '@shared/types';

/** A stand-in NativeImage whose encodings say what was done to it. */
interface FakeImage {
  label: string;
  getSize: () => { width: number; height: number };
  resize: (options: { width: number; quality?: string }) => FakeImage;
  toPNG: () => Buffer;
  toJPEG: (quality: number) => Buffer;
}

const { getSources, displays, createFromBuffer, oversized } = vi.hoisted(() => ({
  getSources: vi.fn(),
  displays: { list: [] as unknown[] },
  createFromBuffer: vi.fn(),
  oversized: { value: false },
}));

vi.mock('electron', () => ({
  desktopCapturer: { getSources },
  screen: { getAllDisplays: () => displays.list },
  nativeImage: { createFromBuffer },
}));

import { Screenshotter } from '../../../../src/main/trackers/screenshotter';

function image(label: string, width: number): FakeImage {
  return {
    label,
    getSize: () => ({ width, height: Math.round(width / 2) }),
    resize: ({ width: next }) => image(`${label}>${next}`, next),
    toPNG: () =>
      oversized.value
        ? ({ length: MAX_CAPTURE_BYTES + 1 } as unknown as Buffer)
        : Buffer.from(`png:${label}`),
    toJPEG: (quality) => Buffer.from(`jpeg${quality}:${label}`),
  };
}

const decode = (base64: string) => Buffer.from(base64, 'base64').toString();

const SETTINGS = {
  screenshotQuality: 80,
  screenshotMaxWidth: 1920,
  blurScreenshots: false,
} as TrackerSettings;

const display = (id: number) => ({ id, size: { width: 1920, height: 1080 }, scaleFactor: 2 });

beforeEach(() => {
  oversized.value = false;
  displays.list = [display(7)];
  getSources.mockReset().mockResolvedValue([
    { display_id: '3', thumbnail: image('other', 3840) },
    { display_id: '7', thumbnail: image('screen7', 3840) },
  ]);
  createFromBuffer
    .mockReset()
    .mockImplementation((buffer: Buffer) => image(`decoded(${buffer.toString()})`, 160));
});

describe('Screenshotter', () => {
  it('captures each display at native pixels and JPEG-encodes a downscaled copy below 100', async () => {
    const [capture] = await new Screenshotter().capture(SETTINGS);

    expect(getSources).toHaveBeenCalledWith({
      types: ['screen'],
      thumbnailSize: { width: 3840, height: 2160 },
    });
    expect(capture).toEqual({
      image: Buffer.from('jpeg80:screen7>1920').toString('base64'),
      mimeType: 'image/jpeg',
      displayId: '7',
      blurred: false,
    });
  });

  it('keeps the native image and encodes it losslessly at quality 100', async () => {
    const [capture] = await new Screenshotter().capture({ ...SETTINGS, screenshotQuality: 100 });

    expect(decode(capture.image)).toBe('png:screen7');
    expect(capture.mimeType).toBe('image/png');
  });

  it('falls back to a full-resolution JPEG when the PNG would be refused for size', async () => {
    oversized.value = true;

    const [capture] = await new Screenshotter().capture({ ...SETTINGS, screenshotQuality: 100 });

    expect(decode(capture.image)).toBe('jpeg100:screen7');
    expect(capture.mimeType).toBe('image/jpeg');
  });

  it('pixelates when blur is on, shrinking hard and scaling back to the target width', async () => {
    const [capture] = await new Screenshotter().capture({ ...SETTINGS, blurScreenshots: true });

    expect(createFromBuffer).toHaveBeenCalledWith(Buffer.from('png:screen7>160'));
    expect(decode(capture.image)).toBe('jpeg80:decoded(png:screen7>160)>1920');
    expect(capture.blurred).toBe(true);
  });

  it('blurs a lossless capture back to its own native width', async () => {
    const [capture] = await new Screenshotter().capture({
      ...SETTINGS,
      screenshotQuality: 100,
      blurScreenshots: true,
    });

    // 3840 / 12 = 320 for the shrink, then back up to the native 3840.
    expect(decode(capture.image)).toBe('png:decoded(png:screen7>320)>3840');
  });

  it('uses the first source when none matches the display, and skips a display with none', async () => {
    displays.list = [display(9), display(10)];
    getSources
      .mockResolvedValueOnce([{ display_id: '1', thumbnail: image('only', 3840) }])
      .mockResolvedValueOnce([]);

    const captures = await new Screenshotter().capture(SETTINGS);

    expect(captures).toHaveLength(1);
    expect(captures[0].displayId).toBe('9');
    expect(decode(captures[0].image)).toBe('jpeg80:only>1920');
  });
});
