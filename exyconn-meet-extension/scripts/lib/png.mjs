import { deflateSync } from 'node:zlib';
import { crc32 } from './crc32.mjs';

const SIGNATURE = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'latin1');
  Buffer.from(data).copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

/**
 * Encodes RGBA pixels (row-major, 4 bytes each) as a PNG — Node built-ins only, so the build
 * needs no image library.
 */
export function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // colour type: RGBA
  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    rows[y * (width * 4 + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, rgba.byteOffset + y * width * 4, width * 4).copy(
      rows,
      y * (width * 4 + 1) + 1,
    );
  }
  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', new Uint8Array(0)),
  ]);
}

/**
 * The extension icon: a rounded brand square with three white sound bars. Colours mirror
 * @exyconn/ui's tokens (indigo[500] and white) — this plain-JS build script cannot import TS.
 */
export const ICON_COLORS = { fill: [0x63, 0x66, 0xf1], ink: [0xff, 0xff, 0xff] };

const SAMPLES = 4;

function insideRoundedRect(x, y, left, top, right, bottom, r) {
  if (x < left || x > right || y < top || y > bottom) {
    return false;
  }
  const cx = Math.min(Math.max(x, left + r), right - r);
  const cy = Math.min(Math.max(y, top + r), bottom - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

/** Bars as [centre x, half height] in a unit square. */
const BARS = [
  [0.3, 0.14],
  [0.5, 0.26],
  [0.7, 0.18],
];

function shade(u, v) {
  if (!insideRoundedRect(u, v, 0, 0, 1, 1, 0.22)) {
    return null;
  }
  const onBar = BARS.some(([cx, half]) =>
    insideRoundedRect(u, v, cx - 0.06, 0.5 - half, cx + 0.06, 0.5 + half, 0.06),
  );
  return onBar ? ICON_COLORS.ink : ICON_COLORS.fill;
}

/** One pixel's colour, averaged over a 4×4 grid of samples (anti-aliasing). */
function samplePixel(x, y, size) {
  const sum = [0, 0, 0];
  let hits = 0;
  for (let sy = 0; sy < SAMPLES; sy += 1) {
    for (let sx = 0; sx < SAMPLES; sx += 1) {
      const color = shade((x + (sx + 0.5) / SAMPLES) / size, (y + (sy + 0.5) / SAMPLES) / size);
      if (color !== null) {
        sum[0] += color[0];
        sum[1] += color[1];
        sum[2] += color[2];
        hits += 1;
      }
    }
  }
  if (hits === 0) {
    return [0, 0, 0, 0];
  }
  const alpha = Math.round((hits / (SAMPLES * SAMPLES)) * 255);
  return [...sum.map((channel) => Math.round(channel / hits)), alpha];
}

/** Renders the icon at one size. */
export function renderIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      pixels.set(samplePixel(x, y, size), (y * size + x) * 4);
    }
  }
  return encodePng(size, size, pixels);
}
