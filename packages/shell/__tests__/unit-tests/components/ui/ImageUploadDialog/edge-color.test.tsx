import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  dominantEdgeColor,
  sampleEdgeColor,
  useEdgeColor,
} from '@/components/ui/ImageUploadDialog/edge-color';

/** An RGBA image `size` px square, every pixel `fill`, with `paint` applied per pixel index. */
function pixelsOf(
  size: number,
  fill: readonly number[],
  paint: (index: number) => readonly number[] | undefined = () => undefined,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let index = 0; index < size * size; index += 1) {
    data.set(paint(index) ?? fill, index * 4);
  }
  return data;
}

describe('dominantEdgeColor', () => {
  it('reads a logo on white as white, whatever sits in the middle', () => {
    // 4 × 4: the 12 border pixels are white, the 4 inside are red.
    const pixels = pixelsOf(4, [255, 255, 255, 255], (index) =>
      [5, 6, 9, 10].includes(index) ? [255, 0, 0, 255] : undefined,
    );

    expect(dominantEdgeColor(pixels, 4)).toBe('#ffffff');
  });

  it('picks the most common shade and averages within it', () => {
    // Top row (4 px) and both sides: near-identical blues win over a black bottom row.
    const pixels = pixelsOf(4, [16, 32, 200, 255], (index) => {
      if (index >= 12) return [0, 0, 0, 255];
      return index % 2 ? [18, 34, 202, 255] : undefined;
    });

    expect(dominantEdgeColor(pixels, 4)).toBe('#1121c9');
  });

  it('ignores transparent edge pixels, and has no colour when the whole edge is clear', () => {
    const clear = pixelsOf(3, [0, 0, 0, 0]);
    expect(dominantEdgeColor(clear, 3)).toBeNull();

    const halfClear = pixelsOf(3, [0, 0, 0, 0], (index) =>
      index < 3 ? [0, 128, 0, 255] : undefined,
    );
    expect(dominantEdgeColor(halfClear, 3)).toBe('#008000');
  });
});

/** Whether the next decode fails. */
const decoder = { fail: false };

class FakeImage extends EventTarget {
  crossOrigin: string | null = null;

  set src(_value: string) {
    queueMicrotask(() => this.dispatchEvent(new Event(decoder.fail ? 'error' : 'load')));
  }
}

function stubCanvas(fill: readonly number[]) {
  const context = {
    drawImage: vi.fn(),
    getImageData: vi.fn((_x: number, _y: number, w: number) => ({ data: pixelsOf(w, fill) })),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  );
  return context;
}

beforeEach(() => {
  decoder.fail = false;
  vi.stubGlobal('Image', FakeImage);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('sampleEdgeColor', () => {
  it('shrinks the image onto a small canvas and reads its edge', async () => {
    const context = stubCanvas([250, 250, 250, 255]);

    await expect(sampleEdgeColor('logo.png')).resolves.toBe('#fafafa');
    expect(context.drawImage).toHaveBeenCalledWith(expect.any(FakeImage), 0, 0, 32, 32);
    expect(context.getImageData).toHaveBeenCalledWith(0, 0, 32, 32);
  });
});

describe('useEdgeColor', () => {
  it('has no colour while reading, then the edge colour of the current image', async () => {
    stubCanvas([0, 0, 0, 255]);
    const { result, rerender } = renderHook(({ src }) => useEdgeColor(src), {
      initialProps: { src: 'a.png' },
    });

    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toBe('#000000'));

    // A new image: the old colour is not shown for it while it is read.
    rerender({ src: 'b.png' });
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toBe('#000000'));
  });

  it('drops a reading that finishes after the image changed or the step closed', async () => {
    stubCanvas([255, 255, 255, 255]);
    const { result, rerender, unmount } = renderHook(({ src }) => useEdgeColor(src), {
      initialProps: { src: 'a.png' },
    });
    rerender({ src: 'b.png' });
    await waitFor(() => expect(result.current).toBe('#ffffff'));

    rerender({ src: 'c.png' });
    expect(result.current).toBeNull();
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current).toBeNull();
  });

  it('logs and stays without a colour when the image cannot be read', async () => {
    decoder.fail = true;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { result } = renderHook(() => useEdgeColor('broken.png'));

    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith('Could not read the image edge colour', expect.any(Error)),
    );
    expect(result.current).toBeNull();
  });
});
