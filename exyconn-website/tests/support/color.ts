import { palette, type PaletteFamily } from "../../src/styles/tokens/palette.tokens";

/**
 * Just enough colour science to measure the tokens: resolve a role to sRGB (following
 * `var()` references and `color-mix()`), composite it over its background, and take the
 * WCAG 2.x contrast ratio.
 */
export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

type RoleLookup = (role: string) => string;

const clamp = (value: number): number => Math.min(1, Math.max(0, value));
const toLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number): number =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

function parseHex(hex: string): Rgba {
  const value = Number.parseInt(hex.slice(1), 16);
  return {
    r: ((value >> 16) & 255) / 255,
    g: ((value >> 8) & 255) / 255,
    b: (value & 255) / 255,
    a: 1,
  };
}

/** OKLCH → linear sRGB → gamma sRGB, clipped to the gamut (what a browser paints). */
function parseOklch(text: string): Rgba {
  const [lText, cText, hText] = text.slice(6, -1).trim().split(/\s+/);
  const l = Number.parseFloat(lText) / 100;
  const c = Number.parseFloat(cText);
  const h = (Number.parseFloat(hText) * Math.PI) / 180;
  const [labA, labB] = [c * Math.cos(h), c * Math.sin(h)];
  const l1 = (l + 0.3963377774 * labA + 0.2158037573 * labB) ** 3;
  const m1 = (l - 0.1055613458 * labA - 0.0638541728 * labB) ** 3;
  const s1 = (l - 0.0894841775 * labA - 1.291485548 * labB) ** 3;
  return {
    r: clamp(toGamma(4.0767416621 * l1 - 3.3077115913 * m1 + 0.2309699292 * s1)),
    g: clamp(toGamma(-1.2684380046 * l1 + 2.6097574011 * m1 - 0.3413193965 * s1)),
    b: clamp(toGamma(-0.0041960863 * l1 - 0.7034186147 * m1 + 1.707614701 * s1)),
    a: 1,
  };
}

/** Splits `a, b` at the top level only, so nested `var()` / `color-mix()` stay whole. */
function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  [...text].forEach((char, index) => {
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
    } else if (char === "," && depth === 0) {
      parts.push(text.slice(start, index).trim());
      start = index + 1;
    }
  });
  parts.push(text.slice(start).trim());
  return parts;
}

/**
 * `color-mix()` interpolated in sRGB. The site mixes in `oklab` too; for the tints measured
 * here the difference is well under one contrast hundredth, so one space serves both.
 */
function mix(text: string, lookup: RoleLookup): Rgba {
  const [, first, second] = splitTopLevel(text.slice("color-mix(".length, -1));
  const weighted = (part: string): [Rgba, number | null] => {
    const match = /^(.*?)\s+([\d.]+)%$/.exec(part);
    return match
      ? [resolveColor(match[1], lookup), Number(match[2]) / 100]
      : [resolveColor(part, lookup), null];
  };
  const [colorA, weightA] = weighted(first);
  const [colorB, weightB] = weighted(second);
  const p = weightA ?? 1 - (weightB ?? 0.5);
  const alpha = colorA.a * p + colorB.a * (1 - p);
  if (alpha === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  const channel = (key: "r" | "g" | "b") =>
    (colorA[key] * colorA.a * p + colorB[key] * colorB.a * (1 - p)) / alpha;
  return { r: channel("r"), g: channel("g"), b: channel("b"), a: alpha };
}

export function resolveColor(value: string, lookup: RoleLookup): Rgba {
  const text = value.trim();
  if (text === "transparent") {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  if (text.startsWith("#")) {
    return parseHex(text);
  }
  if (text.startsWith("oklch(")) {
    return parseOklch(text);
  }
  if (text.startsWith("color-mix(")) {
    return mix(text, lookup);
  }
  const paletteRef = /^var\(--palette-([a-z]+)-(\w+)\)$/.exec(text);
  if (paletteRef) {
    const family = palette[paletteRef[1] as PaletteFamily] as Record<string, string>;
    return resolveColor(family[paletteRef[2]], lookup);
  }
  const roleRef = /^var\(--color-([\w-]+)\)$/.exec(text);
  if (roleRef) {
    return resolveColor(lookup(roleRef[1]), lookup);
  }
  throw new Error(`Cannot resolve colour: ${text}`);
}

/** `top` painted over an opaque `bottom`. */
export function composite(top: Rgba, bottom: Rgba): Rgba {
  const over = (key: "r" | "g" | "b") => top[key] * top.a + bottom[key] * (1 - top.a);
  return { r: over("r"), g: over("g"), b: over("b"), a: 1 };
}

const luminance = ({ r, g, b }: Rgba): number =>
  0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

export function contrastRatio(a: Rgba, b: Rgba): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
