/** The few CSS values the export reads off the editor's inline styles, normalised. */

const HEX_DIGITS = 16;
const BYTE_HEX_WIDTH = 2;

const byteHex = (value: number) =>
  Math.round(Math.min(Math.max(value, 0), 255))
    .toString(HEX_DIGITS)
    .padStart(BYTE_HEX_WIDTH, '0');

/**
 * `#rgb`, `#rrggbb` or `rgb(r, g, b)` as `#rrggbb`; `undefined` for anything else
 * (`inherit`, a named colour), which the renderers then simply leave unset.
 */
export function toHex(css: string | null | undefined): string | undefined {
  const value = css?.trim().toLowerCase();
  if (!value) {
    return undefined;
  }
  if (value.startsWith('#')) {
    const digits = value.slice(1);
    if (digits.length === 3) {
      return `#${[...digits].map((d) => d + d).join('')}`;
    }
    return digits.length === 6 ? value : undefined;
  }
  if (value.startsWith('rgb')) {
    const parts = value
      .slice(value.indexOf('(') + 1, value.indexOf(')'))
      .split(',')
      .map((part) => Number.parseFloat(part));
    if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) {
      return undefined;
    }
    return `#${parts.slice(0, 3).map(byteHex).join('')}`;
  }
  return undefined;
}

/** `16px` as 16; anything not in pixels as `undefined`. */
export function pixels(css: string | null | undefined): number | undefined {
  const value = css?.trim();
  if (!value?.endsWith('px')) {
    return undefined;
  }
  const size = Number.parseFloat(value);
  return Number.isNaN(size) ? undefined : size;
}

/** The first family of a `font-family` list, unquoted. */
export function firstFamily(css: string | null | undefined): string | undefined {
  const first = css?.split(',')[0]?.trim();
  if (!first) {
    return undefined;
  }
  return first.replaceAll('"', '').replaceAll("'", '');
}
