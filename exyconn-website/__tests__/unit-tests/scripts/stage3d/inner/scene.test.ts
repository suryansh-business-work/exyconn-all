// @vitest-environment jsdom
/** The inner stage's objects: protagonist, structure, starfield and the optional nebula. */
import { LineSegments, Mesh, Points, type BufferGeometry, type WebGLRenderer } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResolvedScene } from "../../../../../src/scripts/stage3d/inner/config";
import { buildInnerWorld } from "../../../../../src/scripts/stage3d/inner/scene";
import { readRoles, type Rgb } from "../../../../../src/scripts/stage3d/palette";
import type { QualityTier } from "../../../../../src/scripts/stage3d/quality";
import { createRenderer, disposeScene } from "../../../../../src/scripts/stage3d/renderer";
import type { LineSet } from "../../../../../src/scripts/stage3d/shapes/sampling";
import { buildTargets, type StageTargets } from "../../../../../src/scripts/stage3d/shapes/targets";

vi.mock("../../../../../src/scripts/stage3d/renderer", () => ({
  createRenderer: vi.fn(),
  disposeScene: vi.fn(),
}));
vi.mock("../../../../../src/scripts/stage3d/palette", () => ({ readRoles: vi.fn() }));
vi.mock("../../../../../src/scripts/stage3d/shapes/targets", () => ({ buildTargets: vi.fn() }));

const colours: Record<string, Rgb> = {
  a: [1, 0, 0],
  b: [0, 1, 0],
  deep: [0, 0, 0.1],
  mid: [0.2, 0.2, 0.4],
  line: [0.9, 0.9, 0.9],
};

const tier = (nebulaOctaves: number): QualityTier => ({
  name: "high",
  particles: 2,
  stars: 12,
  filaments: 0,
  ambientPoints: 0,
  nebulaOctaves,
  pixelRatio: 1.5,
  minPixelRatio: 1,
  animate: true,
});

const scene = (shapes: ResolvedScene["shapes"]): ResolvedScene => ({
  shapes,
  data: {},
  accent: ["fuchsia", "cyan"],
  seed: 11,
});

const lineSet = (): LineSet => ({
  positions: new Float32Array(6),
  order: new Float32Array(2),
  flow: new Float32Array([0, 1]),
  along: new Float32Array([0, 1]),
});

/** Two points per shape; tags 1x, 2x, 3x for shapes 0, 1, 2. */
const targets = (shapes: number, lines: LineSet | null): StageTargets => ({
  count: 2,
  positions: Array.from({ length: shapes }, (_, s) => new Float32Array(6).fill(s + 1)),
  tags: Array.from(
    { length: shapes },
    (_, s) => new Float32Array([10 * (s + 1), 10 * (s + 1) + 1])
  ),
  random: new Float32Array([0.25, 0.75]),
  order: new Float32Array([0, 1]),
  lines,
});

let renderer: { setClearColor: ReturnType<typeof vi.fn> };
let stage: HTMLElement;
let host: HTMLElement;

beforeEach(() => {
  stage = document.createElement("section");
  host = document.createElement("div");
  renderer = { setClearColor: vi.fn() };
  vi.mocked(createRenderer).mockReturnValue(renderer as unknown as WebGLRenderer);
  vi.mocked(readRoles).mockReturnValue(colours);
  vi.mocked(buildTargets).mockReturnValue(targets(1, null));
});

afterEach(() => {
  vi.clearAllMocks();
});

const attribute = (geometry: BufferGeometry, name: string) => geometry.getAttribute(name).array;

describe("buildInnerWorld", () => {
  it("reads the accent pair and night roles, and starts a transparent renderer", () => {
    const world = buildInnerWorld(stage, host, scene(["globe"]), tier(0));
    expect(readRoles).toHaveBeenCalledWith(stage, {
      a: "fuchsia-bright",
      b: "cyan-bright",
      deep: "inverse",
      mid: "indigo-night",
      line: "fg",
    });
    expect(createRenderer).toHaveBeenCalledWith(host, 1.5, true);
    expect(renderer.setClearColor).toHaveBeenCalledWith(0x000000, 0);
    expect(world.renderer).toBe(renderer);
    expect(world.camera.fov).toBe(40);
  });

  it("samples the page's shapes at the tier's point budget and seed", () => {
    buildInnerWorld(stage, host, scene(["globe", "city"]), tier(0));
    expect(buildTargets).toHaveBeenCalledWith(["globe", "city"], 2, {}, 11);
  });

  it("repeats a single shape into every morph slot and its tags into every lane", () => {
    const world = buildInnerWorld(stage, host, scene(["globe"]), tier(0));
    const points = world.root.children[0];
    expect(points).toBeInstanceOf(Points);
    const { geometry } = points as Points;
    expect(attribute(geometry, "aShape1")).toBe(attribute(geometry, "position"));
    expect(attribute(geometry, "aShape2")).toBe(attribute(geometry, "position"));
    expect([...attribute(geometry, "aTags")]).toEqual([10, 10, 10, 11, 11, 11]);
    expect([...attribute(geometry, "aRandom")]).toEqual([0.25, 0.75]);
    expect([...attribute(geometry, "aOrder")]).toEqual([0, 1]);
    expect(points.frustumCulled).toBe(false);
  });

  it("packs three shapes' positions and tags side by side", () => {
    vi.mocked(buildTargets).mockReturnValue(targets(3, null));
    const world = buildInnerWorld(stage, host, scene(["core", "globe", "city"]), tier(0));
    const { geometry } = world.root.children[0] as Points;
    expect(attribute(geometry, "aShape1")[0]).toBe(2);
    expect(attribute(geometry, "aShape2")[0]).toBe(3);
    expect([...attribute(geometry, "aTags")]).toEqual([10, 20, 30, 11, 21, 31]);
  });

  it("gives the protagonist the tier's pixel ratio, the accent colours and no highlight", () => {
    const { particles } = buildInnerWorld(stage, host, scene(["globe"]), tier(0));
    expect(particles.uniforms.uPixelRatio.value).toBe(1.5);
    expect(particles.uniforms.uHighlight.value).toBe(-1);
    expect(particles.uniforms.uColA.value.toArray()).toEqual([1, 0, 0]);
    expect(particles.uniforms.uColB.value.toArray()).toEqual([0, 1, 0]);
    expect(particles.depthTest).toBe(false);
  });

  it("draws no structure when the hero shape has none", () => {
    const world = buildInnerWorld(stage, host, scene(["globe"]), tier(0));
    expect(world.lines).toBeNull();
    expect(world.root.children).toHaveLength(1);
  });

  it("adds the hero's structure as lines that build with the points", () => {
    vi.mocked(buildTargets).mockReturnValue(targets(1, lineSet()));
    const world = buildInnerWorld(stage, host, scene(["city"]), tier(0));
    const structure = world.root.children[1];
    expect(structure).toBeInstanceOf(LineSegments);
    const { geometry } = structure as LineSegments;
    expect([...attribute(geometry, "aFlow")]).toEqual([0, 1]);
    expect([...attribute(geometry, "aAlong")]).toEqual([0, 1]);
    expect(world.lines?.uniforms.uLineMix.value).toBe(1);
    expect(world.lines?.uniforms.uColB.value.toArray()).toEqual([0, 1, 0]);
  });

  it("fits the largest shape's width or height to the stage radius", () => {
    const core = buildInnerWorld(stage, host, scene(["core"]), tier(0));
    expect(core.root.scale.x).toBeCloseTo(2 / 1.75);
    const both = buildInnerWorld(stage, host, scene(["core", "jet"]), tier(0));
    expect(both.root.scale.toArray()).toEqual([2 / 5.5, 2 / 5.5, 2 / 5.5]);
  });

  it("scatters the tier's stars on a far shell at half opacity", () => {
    const { scene: built, stars } = buildInnerWorld(stage, host, scene(["globe"]), tier(0));
    const field = built.children[0] as Points;
    expect(field.material).toBe(stars);
    const { array, count } = field.geometry.getAttribute("position");
    expect(count).toBe(12);
    for (let i = 0; i < count; i += 1) {
      const radius = Math.hypot(array[i * 3], array[i * 3 + 1], array[i * 3 + 2]);
      expect(radius).toBeGreaterThanOrEqual(18 - 1e-3);
      expect(radius).toBeLessThanOrEqual(42 + 1e-3);
    }
    expect(stars.uniforms.uOpacity.value).toBe(0.5);
    expect(stars.uniforms.uColor.value.toArray()).toEqual([0.9, 0.9, 0.9]);
  });

  it("leaves the nebula out on tiers without octaves", () => {
    const world = buildInnerWorld(stage, host, scene(["globe"]), tier(0));
    expect(world.nebula).toBeNull();
    expect(world.scene.children).toHaveLength(2);
    expect(world.scene.children[1]).toBe(world.root);
  });

  it("puts a nebula behind everything on desktop tiers", () => {
    const world = buildInnerWorld(stage, host, scene(["globe"]), tier(3));
    expect(world.nebula).toBeInstanceOf(Mesh);
    expect(world.scene.children[0]).toBe(world.nebula);
    expect(world.nebula?.renderOrder).toBe(-10);
    expect(world.nebula?.material.defines).toEqual({ OCTAVES: 3 });
    expect(world.nebula?.material.uniforms.uDeep.value.toArray()).toEqual([0, 0, 0.1]);
    expect(world.nebula?.material.uniforms.uTint.value.toArray()).toEqual([1, 0, 0]);
  });

  it("tears the whole scene down through the shared disposer", () => {
    const world = buildInnerWorld(stage, host, scene(["globe"]), tier(0));
    world.dispose();
    expect(disposeScene).toHaveBeenCalledWith(world.scene, renderer);
  });
});
