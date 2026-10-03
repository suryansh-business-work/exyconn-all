import type { SceneConfig } from "../../scripts/stage3d/inner/config";
import { GLYPHS, type GlyphId } from "./glyphs";

/**
 * Service detail stages: the services hub lattice (one cluster per offering) forms in the
 * hero, and re-forms into the service's own glyph in the closing CTA band (shape index 1).
 */
export const SERVICE_GLYPH_SHAPE = 1;

export const serviceScene = (glyph: GlyphId, clusters: number): SceneConfig => ({
  shapes: ["lattice", "glyph"],
  data: { lattice: { clusters }, glyph: { paths: GLYPHS[glyph] } },
});
