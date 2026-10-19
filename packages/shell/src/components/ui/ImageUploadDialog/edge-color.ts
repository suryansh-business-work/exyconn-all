import { useEffect, useState } from 'react';
import { context2d, loadImage } from './crop-image';

/** The sample canvas's side: plenty to read an edge, small enough to scan instantly. */
const SAMPLE_SIZE = 32;

/** Pixels more transparent than this are not part of the edge's colour. */
const MIN_ALPHA = 128;

/** Channel values are grouped in steps of 16, so near-identical shades count as one colour. */
const BUCKET_SHIFT = 4;

interface Bucket {
  count: number;
  red: number;
  green: number;
  blue: number;
}

const toHex = (value: number): string => Math.round(value).toString(16).padStart(2, '0');

/** Indexes of the pixels on the border of a `size`-square image, each once. */
function edgeIndexes(size: number): number[] {
  const indexes: number[] = [];
  for (let i = 0; i < size; i += 1) {
    indexes.push(i, (size - 1) * size + i);
  }
  for (let row = 1; row < size - 1; row += 1) {
    indexes.push(row * size, row * size + size - 1);
  }
  return indexes;
}

/**
 * The most common colour along the border of `pixels` (RGBA, `size` × `size`), averaged
 * within its group, as `#rrggbb`. `null` when the whole border is transparent.
 */
export function dominantEdgeColor(pixels: Uint8ClampedArray, size: number): string | null {
  const buckets = new Map<number, Bucket>();
  for (const index of edgeIndexes(size)) {
    const offset = index * 4;
    const [red, green, blue, alpha] = pixels.subarray(offset, offset + 4);
    if (alpha >= MIN_ALPHA) {
      const key =
        ((red >> BUCKET_SHIFT) << 8) | ((green >> BUCKET_SHIFT) << 4) | (blue >> BUCKET_SHIFT);
      const bucket = buckets.get(key) ?? { count: 0, red: 0, green: 0, blue: 0 };
      bucket.count += 1;
      bucket.red += red;
      bucket.green += green;
      bucket.blue += blue;
      buckets.set(key, bucket);
    }
  }
  let best: Bucket | null = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) {
      best = bucket;
    }
  }
  if (!best) {
    return null;
  }
  const { count, red, green, blue } = best;
  return `#${toHex(red / count)}${toHex(green / count)}${toHex(blue / count)}`;
}

/** Loads `src`, shrinks it onto a small canvas and reads its dominant edge colour. */
export async function sampleEdgeColor(src: string): Promise<string | null> {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const context = context2d(canvas);
  context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  return dominantEdgeColor(context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data, SAMPLE_SIZE);
}

/**
 * The "Auto" background for `src`: its dominant edge colour, so a logo on white lands on
 * white. `null` while it is read, when the edge is transparent, or when it cannot be read
 * (logged — the picker then behaves as transparent).
 */
export function useEdgeColor(src: string): string | null {
  const [edge, setEdge] = useState<{ src: string; color: string | null } | null>(null);

  useEffect(() => {
    let current = true;
    sampleEdgeColor(src)
      .then((color) => {
        if (current) {
          setEdge({ src, color });
        }
      })
      .catch((error: unknown) => console.warn('Could not read the image edge colour', error));
    return () => {
      current = false;
    };
  }, [src]);

  return edge?.src === src ? edge.color : null;
}
