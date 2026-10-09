import { isShapeId, type ShapeId } from "../shapes/registry";
import { MAX_STAGE_SHAPES, type ShapeData } from "../shapes/targets";

/**
 * What an inner page asks its stage to draw. Written by the page at build time, carried to
 * the browser as JSON on the stage element, and checked again before the scene uses it.
 */
export const ACCENT_HUES = ["violet", "amber", "cyan", "fuchsia", "sky"] as const;
export type AccentHue = (typeof ACCENT_HUES)[number];
export type AccentPair = readonly [AccentHue, AccentHue];

/** One accent pair per page family (blueprint "Shared design system"). */
export const FAMILY_ACCENTS = {
  company: ["violet", "amber"],
  services: ["violet", "cyan"],
  ai: ["fuchsia", "cyan"],
  proof: ["cyan", "amber"],
  blog: ["sky", "violet"],
  contact: ["fuchsia", "amber"],
} as const satisfies Record<string, AccentPair>;

export type PageFamily = keyof typeof FAMILY_ACCENTS;

export interface SceneConfig {
  /** 1–3 shape ids; the first forms in the hero, later ones are reached by echo hosts. */
  shapes: readonly ShapeId[];
  /** Arguments for data-driven shapes, keyed by shape id. */
  data?: ShapeData;
  /** Defaults to the page family's pair. */
  accent?: AccentPair;
  seed?: number;
}

/** A config with every default filled in, as the scene consumes it. */
export interface ResolvedScene {
  shapes: ShapeId[];
  data: ShapeData;
  accent: AccentPair;
  seed?: number;
}

const HUES: ReadonlySet<string> = new Set(ACCENT_HUES);

const isAccentPair = (value: unknown): value is AccentPair =>
  Array.isArray(value) && value.length === 2 && value.every((hue) => HUES.has(hue));

export const resolveScene = (config: SceneConfig, family: PageFamily): ResolvedScene => ({
  shapes: [...config.shapes],
  data: config.data ?? {},
  accent: config.accent ?? FAMILY_ACCENTS[family],
  seed: config.seed,
});

/** Parses the stage's `data-scene-config`; throws on anything the scene could not draw. */
export const parseScene = (json: string): ResolvedScene => {
  const value: unknown = JSON.parse(json);
  if (typeof value !== "object" || value === null) {
    throw new Error("scene config must be an object");
  }
  const { shapes, data, accent, seed } = value as Record<string, unknown>;
  if (
    !Array.isArray(shapes) ||
    shapes.length === 0 ||
    shapes.length > MAX_STAGE_SHAPES ||
    !shapes.every(isShapeId)
  ) {
    throw new Error(`scene config needs 1 to ${MAX_STAGE_SHAPES} known shape ids`);
  }
  if (!isAccentPair(accent)) {
    throw new Error("scene config needs an accent pair");
  }
  return {
    shapes,
    data: typeof data === "object" && data !== null ? data : {},
    accent,
    seed: typeof seed === "number" ? seed : undefined,
  };
};
