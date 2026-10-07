import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Block } from '../../../src/export/model';
import { imageSources, loadImages, printedSize } from '../../../src/export/images';

const image = (src: string): Block => ({ kind: 'image', src, alt: src });

/** Stands in for the browser's Image: decodes, or fails, the way the source says. */
class FakeImage {
  static readonly broken = new Set<string>();
  crossOrigin = '';
  src = '';
  naturalWidth = 40;
  naturalHeight = 20;
  decode(): Promise<void> {
    return FakeImage.broken.has(this.src)
      ? Promise.reject(new Error(`Cannot load ${this.src}`))
      : Promise.resolve();
  }
}

const PNG_BYTES = 'PNG';
const drawImage = vi.fn();

beforeEach(() => {
  FakeImage.broken.clear();
  vi.stubGlobal('Image', FakeImage);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage,
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
    `data:image/png;base64,${globalThis.btoa(PNG_BYTES)}`,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  drawImage.mockReset();
});

describe('imageSources', () => {
  it('finds images in quotes, lists and tables, each once, skipping empty sources', () => {
    const blocks: Block[] = [
      image('a'),
      { kind: 'quote', blocks: [image('b'), image('a')] },
      { kind: 'list', ordered: false, items: [{ blocks: [image('c')] }] },
      {
        kind: 'table',
        rows: [[{ header: false, colSpan: 1, rowSpan: 1, blocks: [image('d'), image('')] }]],
      },
      { kind: 'rule' },
      { kind: 'paragraph', inlines: [] },
    ];
    expect(imageSources(blocks)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('loadImages', () => {
  it('draws every image onto a canvas and reads it back as PNG', async () => {
    const images = await loadImages([image('https://x.test/a.webp')]);
    const loaded = images.get('https://x.test/a.webp');
    expect(loaded).toEqual({
      dataUrl: `data:image/png;base64,${globalThis.btoa(PNG_BYTES)}`,
      bytes: Uint8Array.from([80, 78, 71]),
      width: 40,
      height: 20,
    });
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
    expect(drawImage).toHaveBeenCalledWith(expect.any(FakeImage), 0, 0);
  });

  it('returns an empty map for a document without images', async () => {
    await expect(loadImages([{ kind: 'rule' }])).resolves.toEqual(new Map());
  });

  it('rejects when an image cannot be loaded', async () => {
    FakeImage.broken.add('https://x.test/gone.png');
    await expect(loadImages([image('https://x.test/gone.png')])).rejects.toThrow(
      'Cannot load https://x.test/gone.png',
    );
  });

  it('rejects when the browser has no 2D canvas', async () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
    await expect(loadImages([image('https://x.test/a.png')])).rejects.toThrow(
      'This browser cannot draw images for export',
    );
  });
});

describe('printedSize', () => {
  const loaded = { dataUrl: '', bytes: new Uint8Array(), width: 800, height: 400 };

  it('uses the declared width and keeps the aspect ratio', () => {
    expect(printedSize(loaded, 300, 600)).toEqual({ width: 300, height: 150 });
  });

  it('falls back to the natural width and caps it at the page width', () => {
    expect(printedSize(loaded, undefined, 600)).toEqual({ width: 600, height: 300 });
    expect(printedSize(loaded, 1000, 500)).toEqual({ width: 500, height: 250 });
  });
});
