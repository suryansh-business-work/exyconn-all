/**
 * Stand-ins for what the inner scene runs on in a browser: a world whose renderer records
 * its calls instead of drawing, IntersectionObserver, matchMedia and a frame queue the test
 * flushes by hand. `installBrowser` stubs the globals; `vi.unstubAllGlobals` undoes it.
 */
import {
  Group,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  type WebGLRenderer,
} from "three";
import { vi } from "vitest";
import type { InnerWorld } from "../../../../../src/scripts/stage3d/inner/scene";
import type { QualityTier } from "../../../../../src/scripts/stage3d/quality";

export class FakeObserver {
  static readonly instances: FakeObserver[] = [];
  readonly observed: Element[] = [];
  readonly disconnect = vi.fn();

  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit
  ) {
    FakeObserver.instances.push(this);
  }

  observe(target: Element) {
    this.observed.push(target);
  }

  fire(entries: Partial<IntersectionObserverEntry>[]) {
    this.callback(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
  }
}

const frames = new Map<number, FrameRequestCallback>();
let nextFrame = 0;
/** Added to the real clock so every flushed frame lands a full second after the last. */
let skew = 0;

/** Frames waiting to run. */
export const pendingFrames = (): number => frames.size;

/** Runs every waiting frame once, a whole clamped step (50 ms) after the last. */
export const flushFrame = (): void => {
  const pending = [...frames.values()];
  frames.clear();
  skew += 1000;
  const now = performance.now() + skew;
  pending.forEach((callback) => callback(now));
};

/** Flushes frames until none are requested (at most `limit`); returns how many ran. */
export const flushAll = (limit = 400): number => {
  let count = 0;
  while (frames.size > 0 && count < limit) {
    flushFrame();
    count += 1;
  }
  return count;
};

export const installBrowser = (wide = true) => {
  frames.clear();
  FakeObserver.instances.length = 0;
  const matchMedia = vi.fn(() => ({ matches: wide }));
  const requestFrame = vi.fn((callback: FrameRequestCallback) => {
    nextFrame += 1;
    frames.set(nextFrame, callback);
    return nextFrame;
  });
  const cancelFrame = vi.fn((id: number) => {
    frames.delete(id);
  });
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  vi.stubGlobal("matchMedia", matchMedia);
  vi.stubGlobal("requestAnimationFrame", requestFrame);
  vi.stubGlobal("cancelAnimationFrame", cancelFrame);
  return { matchMedia, requestFrame, cancelFrame };
};

/** The hero observer and the echo observer, in the order the scene creates them. */
export const observers = () => {
  const [hero, echo] = FakeObserver.instances;
  return { hero, echo };
};

export const setSize = (element: HTMLElement, width: number, height: number): void => {
  Object.defineProperty(element, "clientWidth", { configurable: true, value: width });
  Object.defineProperty(element, "clientHeight", { configurable: true, value: height });
};

export const makeTier = (animate: boolean): QualityTier => ({
  name: "balanced",
  particles: 100,
  stars: 10,
  filaments: 0,
  ambientPoints: 0,
  nebulaOctaves: 2,
  pixelRatio: 1,
  minPixelRatio: 1,
  animate,
});

const value = (initial: number) => ({ value: initial });

export const makeWorld = ({ nebula = true, lines = true } = {}) => {
  const renderer = {
    domElement: document.createElement("canvas"),
    setSize: vi.fn(),
    getPixelRatio: vi.fn(() => 2),
    render: vi.fn(),
    compileAsync: vi.fn(() => Promise.resolve()),
  };
  const particles = new ShaderMaterial({
    uniforms: {
      uTime: value(0),
      uShape: value(0),
      uForm: value(0),
      uAngle: value(0),
      uHighlight: value(-1),
      uHighlightMix: value(0),
      uAspect: value(1),
      uPointer: { value: new Vector2() },
      uPointerMix: value(0),
    },
  });
  const structure = new ShaderMaterial({
    uniforms: { uTime: value(0), uForm: value(0), uAngle: value(0), uLineMix: value(0) },
  });
  const backdrop = new Mesh(
    new PlaneGeometry(2, 2),
    new ShaderMaterial({ uniforms: { uResolution: { value: new Vector2(1, 1) }, uTime: value(0) } })
  );
  const world: InnerWorld = {
    renderer: renderer as unknown as WebGLRenderer,
    scene: new Scene(),
    camera: new PerspectiveCamera(40, 1, 0.1, 120),
    root: new Group(),
    particles,
    lines: lines ? structure : null,
    stars: new ShaderMaterial({ uniforms: { uTime: value(0) } }),
    nebula: nebula ? backdrop : null,
    dispose: vi.fn(),
  };
  return { world, renderer, particles, structure, backdrop };
};
