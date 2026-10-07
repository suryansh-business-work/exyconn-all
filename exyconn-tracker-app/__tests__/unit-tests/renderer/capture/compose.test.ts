// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { alpha, color } from '@exyconn/ui';
import { overlayRect } from '@exyconn/tracker-core';
import type { CaptureRequest } from '@shared/types';
import { composeCapture } from '../../../../src/renderer/capture/compose';
import { grabWebcamFrame, loadImage } from '../../../../src/renderer/capture/webcam';

vi.mock('../../../../src/renderer/capture/webcam', () => ({
  loadImage: vi.fn(),
  grabWebcamFrame: vi.fn(),
}));

const SCREEN = { naturalWidth: 2000, naturalHeight: 1000 };
const VIDEO = { videoWidth: 640, videoHeight: 480 };

/** Records every drawing call, in order, plus the styles set on it. */
function fakeContext() {
  const calls: string[] = [];
  const drawn: unknown[][] = [];
  const record =
    (name: string) =>
    (...args: unknown[]): void => {
      calls.push(name);
      drawn.push([name, ...args]);
    };
  return {
    calls,
    drawn,
    strokeStyle: '',
    lineWidth: 0,
    save: record('save'),
    beginPath: record('beginPath'),
    roundRect: record('roundRect'),
    stroke: record('stroke'),
    clip: record('clip'),
    drawImage: record('drawImage'),
    restore: record('restore'),
  };
}

function request(overrides: Partial<CaptureRequest> = {}): CaptureRequest {
  return {
    id: 'cap-1',
    screen: 'U0NSRUVO',
    mimeType: 'image/jpeg',
    corner: 'bottom-right',
    quality: 80,
    ...overrides,
  };
}

let context: ReturnType<typeof fakeContext>;
let toDataURL: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  context = fakeContext();
  toDataURL = vi.fn(() => 'data:image/jpeg;base64,Q09NUE9TRUQ=');
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as never);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(toDataURL as never);
  vi.mocked(loadImage).mockResolvedValue(SCREEN as never);
  vi.mocked(grabWebcamFrame).mockResolvedValue(VIDEO as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('composeCapture', () => {
  it('decodes the screen in the encoding main sent', async () => {
    await composeCapture(request({ screen: 'UE5H', mimeType: 'image/png' }));
    expect(loadImage).toHaveBeenCalledWith('UE5H', 'image/png');
  });

  it('returns raw base64 without the data-URL prefix', async () => {
    await expect(composeCapture(request())).resolves.toBe('Q09NUE9TRUQ=');
  });

  it('encodes in the requested MIME type at the workspace quality', async () => {
    await composeCapture(request({ mimeType: 'image/jpeg', quality: 65 }));
    expect(toDataURL).toHaveBeenCalledWith('image/jpeg', 0.65);
  });

  it('keeps a PNG lossless at quality 100', async () => {
    await composeCapture(request({ mimeType: 'image/png', quality: 100 }));
    expect(toDataURL).toHaveBeenCalledWith('image/png', 1);
  });

  it('draws the screen first at full size, then the webcam card on top', async () => {
    await composeCapture(request());
    expect(context.calls).toEqual([
      'drawImage',
      'save',
      'beginPath',
      'roundRect',
      'stroke',
      'clip',
      'drawImage',
      'restore',
    ]);
    expect(context.drawn[0]).toEqual(['drawImage', SCREEN, 0, 0]);
  });

  it('places the photo in the chosen corner, inside a rounded, bordered frame', async () => {
    await composeCapture(request({ corner: 'top-left' }));
    const rect = overlayRect('top-left', { width: 2000, height: 1000 }, 640 / 480);
    const radius = Math.round(rect.width * 0.06);
    expect(context.drawn).toContainEqual([
      'roundRect',
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      radius,
    ]);
    expect(context.drawn).toContainEqual([
      'drawImage',
      VIDEO,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
    ]);
    expect(context.lineWidth).toBe(Math.round(rect.width * 0.012));
    expect(context.strokeStyle).toBe(alpha(color.white, 0.9));
  });

  it('never draws the border thinner than one pixel on a tiny screen', async () => {
    vi.mocked(loadImage).mockResolvedValue({ naturalWidth: 100, naturalHeight: 60 } as never);
    await composeCapture(request());
    expect(context.lineWidth).toBe(1);
  });

  it('fails clearly, before touching the camera, when the window cannot draw', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await expect(composeCapture(request())).rejects.toThrow('This window cannot draw the capture.');
    expect(grabWebcamFrame).not.toHaveBeenCalled();
  });

  it('passes on a camera failure', async () => {
    vi.mocked(grabWebcamFrame).mockRejectedValue(new Error('Camera busy'));
    await expect(composeCapture(request())).rejects.toThrow('Camera busy');
    expect(toDataURL).not.toHaveBeenCalled();
  });
});
