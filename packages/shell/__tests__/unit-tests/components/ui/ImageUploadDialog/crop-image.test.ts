import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cropImageToDataUrl } from '@/components/ui/ImageUploadDialog/crop-image';

/** Whether the next decode fails, and the image the code under test created last. */
const decoder: { fail: boolean; last: FakeImage | null } = { fail: false, last: null };

/** Stands in for the browser's image decoder: loads (or fails) as soon as a src is set. */
class FakeImage extends EventTarget {
  crossOrigin: string | null = null;
  private source = '';

  constructor() {
    super();
    decoder.last = this;
  }

  get src(): string {
    return this.source;
  }

  set src(value: string) {
    this.source = value;
    queueMicrotask(() => this.dispatchEvent(new Event(decoder.fail ? 'error' : 'load')));
  }
}

const rect = { x: 10.4, y: 20, width: 99.6, height: 50.2 };

beforeEach(() => {
  decoder.fail = false;
  vi.stubGlobal('Image', FakeImage);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('cropImageToDataUrl', () => {
  it('draws the rectangle onto a canvas of its rounded size and returns a JPEG', async () => {
    const context = { drawImage: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
    const toDataURL = vi
      .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
      .mockReturnValue('data:image/jpeg;base64,AAAA');

    const result = await cropImageToDataUrl('https://images.pexels.com/1.jpg', rect, 'image/jpeg');

    expect(result).toBe('data:image/jpeg;base64,AAAA');
    expect(decoder.last?.crossOrigin).toBe('anonymous');
    expect(context.drawImage).toHaveBeenCalledWith(
      decoder.last,
      10.4,
      20,
      99.6,
      50.2,
      0,
      0,
      100,
      50,
    );
    expect(toDataURL).toHaveBeenCalledWith('image/jpeg', 0.92);
  });

  it('keeps a PNG a PNG, so transparency survives', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    const toDataURL = vi
      .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
      .mockReturnValue('data:image/png;base64,BBBB');

    await cropImageToDataUrl('data:image/png;base64,xyz', rect, 'image/png');

    expect(toDataURL).toHaveBeenCalledWith('image/png', 0.92);
  });

  it('rejects when the browser has no 2D canvas', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    await expect(cropImageToDataUrl('a.jpg', rect, 'image/jpeg')).rejects.toThrow(
      'This browser cannot crop images',
    );
  });

  it('rejects when the image cannot be loaded', async () => {
    decoder.fail = true;

    await expect(cropImageToDataUrl('broken.jpg', rect, 'image/jpeg')).rejects.toThrow(
      'Could not load the image to crop',
    );
  });
});
