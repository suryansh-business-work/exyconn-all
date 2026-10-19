import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cropImageToDataUrl, MAX_OUTPUT_EDGE } from '@/components/ui/ImageUploadDialog/crop-image';

/** Whether the next decode fails, and the image the code under test created last. */
const decoder: { fail: boolean; last: FakeImage | null } = { fail: false, last: null };

/** Stands in for the browser's image decoder: a 200 × 100 image that loads (or fails) at once. */
class FakeImage extends EventTarget {
  crossOrigin: string | null = null;
  readonly naturalWidth = 200;
  readonly naturalHeight = 100;
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

/** A 2D context that records what was painted, and the filter active at each draw. */
function fakeContext() {
  const context = {
    fillStyle: '',
    filter: 'none',
    filtersAtDraw: [] as string[],
    fillRect: vi.fn(),
    drawImage: vi.fn(() => {
      context.filtersAtDraw.push(context.filter);
    }),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  );
  return context;
}

function stubOutput(dataUrl = 'data:image/jpeg;base64,AAAA') {
  return vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(dataUrl);
}

/** A rectangle wholly on the 200 × 100 image. */
const inside = { x: 10.4, y: 20, width: 99.6, height: 50.2 };
/** Zoomed out: the frame starts 50 px before the image and is larger than it. */
const around = { x: -50, y: -50, width: 300, height: 200 };

beforeEach(() => {
  decoder.fail = false;
  vi.stubGlobal('Image', FakeImage);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('cropImageToDataUrl', () => {
  it('draws a rectangle on the image at its offset, on a canvas of its rounded size, as JPEG', async () => {
    const context = fakeContext();
    const toDataURL = stubOutput();

    const result = await cropImageToDataUrl(
      'https://images.pexels.com/1.jpg',
      { ...inside, fill: { kind: 'color', color: '#ff0000' } },
      'image/jpeg',
    );

    expect(result).toBe('data:image/jpeg;base64,AAAA');
    expect(decoder.last?.crossOrigin).toBe('anonymous');
    // The image covers the frame, so the backdrop is never painted.
    expect(context.fillRect).not.toHaveBeenCalled();
    expect(context.drawImage).toHaveBeenCalledTimes(1);
    expect(context.drawImage).toHaveBeenCalledWith(decoder.last, -10.4, -20, 200, 100);
    expect(toDataURL.mock.contexts[0]).toMatchObject({ width: 100, height: 50 });
    expect(toDataURL).toHaveBeenCalledWith('image/jpeg', 0.92);
  });

  it('keeps a PNG a PNG and a WebP a WebP', async () => {
    fakeContext();
    const toDataURL = stubOutput();

    await cropImageToDataUrl('data:image/png;base64,xyz', inside, 'image/png');
    await cropImageToDataUrl('data:image/webp;base64,xyz', inside, 'image/webp');

    expect(toDataURL).toHaveBeenNthCalledWith(1, 'image/png', 0.92);
    expect(toDataURL).toHaveBeenNthCalledWith(2, 'image/webp', 0.92);
  });

  it('paints a colour around a zoomed-out image and centres the image on it', async () => {
    const context = fakeContext();
    const toDataURL = stubOutput();

    await cropImageToDataUrl(
      'a.jpg',
      { ...around, fill: { kind: 'color', color: '#fafafa' } },
      'image/jpeg',
    );

    expect(context.fillStyle).toBe('#fafafa');
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 300, 200);
    expect(context.drawImage).toHaveBeenCalledWith(decoder.last, 50, 50, 200, 100);
    expect(toDataURL).toHaveBeenCalledWith('image/jpeg', 0.92);
  });

  it('puts a zoomed-out image on a blurred copy of itself that covers the frame', async () => {
    const context = fakeContext();
    stubOutput();

    await cropImageToDataUrl('a.jpg', { ...around, fill: { kind: 'blur' } }, 'image/jpeg');

    // Blur radius 4% of 300 = 12; cover scale max(324/200, 224/100) = 2.24 → 448 × 224.
    const [source, ...box] = context.drawImage.mock.calls[0] as unknown[];
    expect(source).toBe(decoder.last);
    [-74, -12, 448, 224].forEach((value, index) => expect(box[index]).toBeCloseTo(value));
    expect(context.drawImage).toHaveBeenNthCalledWith(2, decoder.last, 50, 50, 200, 100);
    expect(context.filtersAtDraw).toEqual(['blur(12px)', 'none']);
    expect(context.fillRect).not.toHaveBeenCalled();
  });

  it('leaves the space transparent and writes a PNG when there is no backdrop', async () => {
    const context = fakeContext();
    const toDataURL = stubOutput();

    await cropImageToDataUrl('a.jpg', { ...around, fill: { kind: 'none' } }, 'image/jpeg');
    await cropImageToDataUrl('a.jpg', around, 'image/jpeg');

    expect(context.fillRect).not.toHaveBeenCalled();
    expect(toDataURL).toHaveBeenNthCalledWith(1, 'image/png', 0.92);
    expect(toDataURL).toHaveBeenNthCalledWith(2, 'image/png', 0.92);
  });

  it('needs a backdrop as soon as the frame passes any edge of the image', async () => {
    fakeContext();
    const toDataURL = stubOutput();
    const frames = [
      { x: 0, y: -1, width: 10, height: 10 },
      { x: 0, y: 0, width: 201, height: 10 },
      { x: 0, y: 0, width: 10, height: 101 },
    ];

    for (const frame of frames) {
      await cropImageToDataUrl('a.jpg', frame, 'image/jpeg');
    }

    expect(toDataURL.mock.calls.map(([type]) => type)).toEqual([
      'image/png',
      'image/png',
      'image/png',
    ]);
  });

  it('scales a frame larger than the output limit down to it', async () => {
    const context = fakeContext();
    const toDataURL = stubOutput();

    await cropImageToDataUrl(
      'a.jpg',
      { x: -100, y: -40, width: MAX_OUTPUT_EDGE * 2, height: MAX_OUTPUT_EDGE },
      'image/jpeg',
    );

    expect(toDataURL.mock.contexts[0]).toMatchObject({
      width: MAX_OUTPUT_EDGE,
      height: MAX_OUTPUT_EDGE / 2,
    });
    expect(context.drawImage).toHaveBeenCalledWith(decoder.last, 50, 20, 100, 50);
  });

  it('rejects when the browser has no 2D canvas', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    await expect(cropImageToDataUrl('a.jpg', inside, 'image/jpeg')).rejects.toThrow(
      'This browser cannot crop images',
    );
  });

  it('rejects when the image cannot be loaded', async () => {
    decoder.fail = true;

    await expect(cropImageToDataUrl('broken.jpg', inside, 'image/jpeg')).rejects.toThrow(
      'Could not load the image to crop',
    );
  });
});
