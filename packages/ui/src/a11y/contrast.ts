/**
 * WCAG 2.2 contrast, computed rather than eyeballed.
 *
 * Used two ways: by tests that hold every token pairing to AA, and at runtime for the one
 * colour an administrator chooses — a portal's brand accent — where the ink laid on it has to
 * be picked, not assumed.
 */

/** AA for normal text (SC 1.4.3). */
export const AA_TEXT = 4.5;
/** AA for large text (≥ 24px, or ≥ 18.66px bold) and for UI component boundaries (SC 1.4.11). */
export const AA_LARGE = 3;

/** `#rgb`, `#rrggbb` or `rgb()/rgba()` → [r, g, b] in 0–255. Alpha is ignored. */
export function parseColor(color: string): [number, number, number] {
  const value = color.trim();
  if (value.startsWith('#')) {
    const hex = value.slice(1);
    const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex.slice(0, 6);
    return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16)) as [
      number,
      number,
      number,
    ];
  }
  const match = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(value);
  if (!match) {
    throw new Error(`Cannot read a colour from "${color}"`);
  }
  return [match[1], match[2], match[3]].map(Number) as [number, number, number];
}

/** Relative luminance as WCAG defines it. */
export function luminance(color: string): number {
  const [r, g, b] = parseColor(color).map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The contrast ratio between two colours, 1–21. Order does not matter. */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Whichever of two inks reads better on `background` — for text on a colour nobody chose in
 * advance, such as a portal's brand accent.
 */
export function readableInk(background: string, dark = '#111111', light = '#ffffff'): string {
  return contrastRatio(background, dark) >= contrastRatio(background, light) ? dark : light;
}

/** `[r, g, b]` → `#rrggbb`. */
function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * `color`, moved toward black or white just far enough to reach `ratio` on `background`.
 *
 * For a colour an administrator picks — a portal's brand accent — that is also used as text
 * or as the edge of a control. The hue is kept; only the lightness gives, and only as much as
 * the contrast needs, so a brand that already passes comes back unchanged. It moves toward
 * whichever end contrasts with the background, which is the only direction that can help.
 */
export function ensureContrast(color: string, background: string, ratio = AA_TEXT): string {
  if (contrastRatio(color, background) >= ratio) {
    return toHex(parseColor(color));
  }
  const target: [number, number, number] =
    luminance(background) > 0.5 ? [0, 0, 0] : [255, 255, 255];
  const start = parseColor(color);
  for (let step = 1; step <= 20; step += 1) {
    const mix = step / 20;
    const candidate = toHex(
      start.map((channel, i) => channel + (target[i] - channel) * mix) as [number, number, number],
    );
    if (contrastRatio(candidate, background) >= ratio) {
      return candidate;
    }
  }
  return toHex(target);
}
