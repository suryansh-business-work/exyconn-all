import { PerspectiveCamera, type BufferGeometry, type Points, type ShaderMaterial } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildScene } from "../../../../../src/scripts/home3d/scene/build";
import { palette, tier } from "./scene-fixtures";

const mocks = vi.hoisted(() => ({
  readPalette: vi.fn(),
  createRenderer: vi.fn(),
  disposeScene: vi.fn(),
}));
vi.mock("../../../../../src/scripts/stage3d/palette", () => ({ readPalette: mocks.readPalette }));
vi.mock("../../../../../src/scripts/stage3d/renderer", () => ({
  createRenderer: mocks.createRenderer,
  disposeScene: mocks.disposeScene,
}));

// Only the DOM elements' identity matters: palette and renderer are stand-ins.
const stageElement = { id: "stage" } as unknown as HTMLElement;
const host = { id: "host" } as unknown as HTMLElement;
const renderer = { setPixelRatio: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.readPalette.mockReturnValue(palette);
  mocks.createRenderer.mockReturnValue(renderer);
});

describe("buildScene", () => {
  it("reads the stage's palette and starts the renderer at the tier's pixel ratio", () => {
    const built = buildScene(stageElement, host, tier({ pixelRatio: 1.5 }), false);
    expect(mocks.readPalette).toHaveBeenCalledWith(stageElement);
    expect(mocks.createRenderer).toHaveBeenCalledWith(host, 1.5);
    expect(built.renderer).toBe(renderer);
    expect(built.stage.palette).toBe(palette);
  });

  it("puts the backdrop, the subject's root, the HUD and the background worlds in the scene", () => {
    const { scene, stage } = buildScene(stageElement, host, tier(), false);
    expect(scene.children).toEqual([
      stage.backdrop.nebula,
      stage.backdrop.grid,
      stage.backdrop.stars,
      stage.root,
      stage.hud.group,
      stage.accents.planes.group,
      stage.accents.robots.group,
      stage.accents.satellites.group,
    ]);
    expect(stage.root.children).toEqual([
      stage.protagonist.points,
      stage.accents.radar,
      stage.accents.filaments,
    ]);
  });

  it("leaves the filaments out for a tier that draws none", () => {
    const { stage } = buildScene(stageElement, host, tier({ filaments: 0 }), false);
    expect(stage.accents.filaments).toBeNull();
    expect(stage.root.children).toEqual([stage.protagonist.points, stage.accents.radar]);
  });

  it("sizes the protagonist from the tier and frames it with a 40° camera", () => {
    const { stage } = buildScene(stageElement, host, tier({ particles: 250 }), true);
    expect(stage.protagonist.points.geometry.getAttribute("position").count).toBe(250);
    expect(stage.protagonist.material.uniforms.uScatter.value).toBe(0.6);
    expect(stage.camera).toBeInstanceOf(PerspectiveCamera);
    expect([stage.camera.fov, stage.camera.near, stage.camera.far]).toEqual([40, 0.1, 120]);
  });

  it("changes the pixel ratio of the renderer and of every point material together", () => {
    const built = buildScene(stageElement, host, tier(), false);
    built.setPixelRatio(0.75);
    expect(renderer.setPixelRatio).toHaveBeenCalledWith(0.75);
    const { protagonist, backdrop, accents } = built.stage;
    const materials: ShaderMaterial[] = [
      protagonist.material,
      backdrop.stars.material,
      accents.planes.material,
      accents.robots.material,
      accents.satellites.material,
    ];
    materials.forEach((material) => expect(material.uniforms.uPixelRatio.value).toBe(0.75));
    const plane = accents.planes.group.children[0] as Points<BufferGeometry, ShaderMaterial>;
    expect(plane.material.uniforms.uPixelRatio.value).toBe(0.75);
  });

  it("disposes the scene with its renderer", () => {
    const built = buildScene(stageElement, host, tier(), false);
    built.dispose();
    expect(mocks.disposeScene).toHaveBeenCalledWith(built.scene, renderer);
  });
});
