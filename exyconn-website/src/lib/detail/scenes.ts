import type { SceneConfig } from "../../scripts/stage3d/inner/config";
import { GLYPHS } from "./glyphs";

/**
 * A stage scene as the CMS stores it, plus the 2D mark its `glyph` shape draws, named — the
 * marks are geometry, kept in code (./glyphs.ts). Service stages build the service as a scene
 * and their closing CTA band re-forms it into the glyph (shape index 1).
 */
export const sceneWithGlyph = (scene: SceneConfig, glyph: string): SceneConfig => {
  if (!Object.hasOwn(GLYPHS, glyph)) {
    return scene;
  }
  const paths = GLYPHS[glyph as keyof typeof GLYPHS];
  return { ...scene, data: { ...scene.data, glyph: { paths } } };
};
