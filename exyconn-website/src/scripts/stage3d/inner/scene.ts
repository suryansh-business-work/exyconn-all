import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  LineSegments,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  type WebGLRenderer,
} from "three";
import type { LineSet } from "../shapes/sampling";
import { innerLinesFragment, innerLinesVertex } from "../shaders/inner-lines";
import { createRandom } from "../math";
import { glowPointsMaterial, pointsGeometry } from "../materials";
import { readRoles, type Rgb } from "../palette";
import type { QualityTier } from "../quality";
import { createRenderer, disposeScene } from "../renderer";
import { backdropFragment, backdropVertex } from "../shaders/backdrop";
import { innerParticleVertex } from "../shaders/inner-particles";
import { glowFragment } from "../shaders/points";
import { onSphere } from "../shapes/sampling";
import { SHAPES } from "../shapes/registry";
import { buildTargets } from "../shapes/targets";
import { colorUniform } from "../uniforms";
import type { ResolvedScene } from "./config";

/**
 * The inner stage's objects: an optional nebula (desktop tiers only), a sparse starfield and
 * one Points protagonist carrying the page's 1–3 shapes. Colours are the page's accent pair,
 * read from the night roles on the stage element.
 */
export interface InnerWorld {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  root: Group;
  particles: ShaderMaterial;
  /** The hero shape's structure — edges and data links — when it draws one. */
  lines: ShaderMaterial | null;
  stars: ShaderMaterial;
  nebula: Mesh<PlaneGeometry, ShaderMaterial> | null;
  dispose: () => void;
}

/** World units the largest shape is scaled to. */
const FIT_RADIUS = 2;

type Colours = Record<"a" | "b" | "deep" | "mid" | "line", Rgb>;

/** Packs each point's tag in shapes 0–2 into one vec3; a missing shape repeats the last. */
const packTags = (tags: readonly Float32Array[], count: number): Float32Array => {
  const packed = new Float32Array(count * 3);
  for (let slot = 0; slot < 3; slot += 1) {
    const source = tags[Math.min(slot, tags.length - 1)];
    for (let i = 0; i < count; i += 1) {
      packed[i * 3 + slot] = source[i];
    }
  }
  return packed;
};

const protagonist = (config: ResolvedScene, tier: QualityTier, colours: Colours) => {
  const targets = buildTargets(config.shapes, tier.particles, config.data, config.seed);
  const [first, second = first, third = second] = targets.positions;
  const tags = packTags(targets.tags, targets.count);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(first, 3));
  geometry.setAttribute("aShape1", new BufferAttribute(second, 3));
  geometry.setAttribute("aShape2", new BufferAttribute(third, 3));
  geometry.setAttribute("aTags", new BufferAttribute(tags, 3));
  geometry.setAttribute("aRandom", new BufferAttribute(targets.random, 1));
  geometry.setAttribute("aOrder", new BufferAttribute(targets.order, 1));
  const material = new ShaderMaterial({
    vertexShader: innerParticleVertex,
    fragmentShader: glowFragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uShape: { value: 0 },
      uForm: { value: 0 },
      uAngle: { value: 0 },
      uSize: { value: 1.8 },
      uPixelRatio: { value: tier.pixelRatio },
      uOpacity: { value: 1 },
      uHighlight: { value: -1 },
      uHighlightMix: { value: 0 },
      uColA: colorUniform(colours.a),
      uColB: colorUniform(colours.b),
      uPointer: { value: new Vector2(0, 0) },
      uPointerMix: { value: 0 },
      uAspect: { value: 1 },
    },
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  return { points, material, lines: targets.lines };
};

/** The structure layer: thin additive lines that build and turn with the points. */
const structureFor = (lines: LineSet, colours: Colours) => {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(lines.positions, 3));
  geometry.setAttribute("aOrder", new BufferAttribute(lines.order, 1));
  geometry.setAttribute("aFlow", new BufferAttribute(lines.flow, 1));
  geometry.setAttribute("aAlong", new BufferAttribute(lines.along, 1));
  const material = new ShaderMaterial({
    vertexShader: innerLinesVertex,
    fragmentShader: innerLinesFragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uForm: { value: 0 },
      uAngle: { value: 0 },
      uLineMix: { value: 1 },
      uOpacity: { value: 1 },
      uColA: colorUniform(colours.a),
      uColB: colorUniform(colours.b),
    },
  });
  const mesh = new LineSegments(geometry, material);
  mesh.frustumCulled = false;
  return { mesh, material };
};

const nebulaFor = (tier: QualityTier, colours: Colours) => {
  if (tier.nebulaOctaves <= 0) {
    return null;
  }
  const colour = (name: keyof Colours) => colorUniform(colours[name]);
  const mesh = new Mesh(
    new PlaneGeometry(2, 2),
    new ShaderMaterial({
      vertexShader: backdropVertex,
      fragmentShader: backdropFragment,
      defines: { OCTAVES: tier.nebulaOctaves },
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uResolution: { value: new Vector2(1, 1) },
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uFocus: { value: new Vector2(0.72, 0.5) },
        uTintAmount: { value: 0.18 },
        uDeep: colour("deep"),
        uMid: colour("mid"),
        uGlowA: colour("a"),
        uGlowB: colour("b"),
        uTint: colour("a"),
        uScrimSide: { value: new Vector2(1, 0) },
      },
    })
  );
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return mesh;
};

export const buildInnerWorld = (
  stage: HTMLElement,
  host: HTMLElement,
  config: ResolvedScene,
  tier: QualityTier
): InnerWorld => {
  const [a, b] = config.accent;
  const colours = readRoles(stage, {
    a: `${a}-bright`,
    b: `${b}-bright`,
    deep: "inverse",
    mid: "indigo-night",
    line: "fg",
  });
  const renderer = createRenderer(host, tier.pixelRatio, true);
  renderer.setClearColor(0x000000, 0);
  const hero = protagonist(config, tier, colours);
  const root = new Group();
  root.add(hero.points);
  const structure = hero.lines ? structureFor(hero.lines, colours) : null;
  if (structure) {
    root.add(structure.mesh);
  }
  const largest = Math.max(...config.shapes.flatMap((id) => SHAPES[id].bounds.slice(0, 2)));
  root.scale.setScalar(FIT_RADIUS / largest);

  const random = createRandom(7);
  const starPositions = new Float32Array(tier.stars * 3);
  for (let i = 0; i < tier.stars; i += 1) {
    starPositions.set(onSphere(random, 18 + random() * 24), i * 3);
  }
  const stars = new Points(
    pointsGeometry(starPositions, random),
    glowPointsMaterial(colours.line, 2.2, tier.pixelRatio)
  );
  stars.material.uniforms.uOpacity.value = 0.5;
  stars.frustumCulled = false;

  const nebula = nebulaFor(tier, colours);
  const scene = new Scene();
  scene.add(...(nebula ? [nebula] : []), stars, root);
  return {
    renderer,
    scene,
    camera: new PerspectiveCamera(40, 1, 0.1, 120),
    root,
    particles: hero.material,
    lines: structure?.material ?? null,
    stars: stars.material,
    nebula,
    dispose: () => disposeScene(scene, renderer),
  };
};
