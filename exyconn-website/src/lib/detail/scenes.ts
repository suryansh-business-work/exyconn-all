import type { SceneConfig } from "../../scripts/stage3d/inner/config";
import type { ShapeId } from "../../scripts/stage3d/shapes/registry";
import { GLYPHS, type GlyphId } from "./glyphs";

/**
 * Service detail stages: the hero builds the service as a scene — an enterprise district, a
 * server room feeding its charts, phones running an app — and the closing CTA band re-forms
 * it into the service's own glyph (shape index 1).
 */
export const SERVICE_GLYPH_SHAPE = 1;

export const serviceScene = (hero: ShapeId, glyph: GlyphId): SceneConfig => ({
  shapes: [hero, "glyph"],
  data: { glyph: { paths: GLYPHS[glyph] } },
});
