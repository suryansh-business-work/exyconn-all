import type { QualityTier } from "../quality";
import { SHAPES } from "../shapes/registry";
import { createAnimator } from "./animator";
import type { ResolvedScene } from "./config";
import { listenForHighlights } from "./highlight";
import { createStageInput } from "./interaction";
import { damp, smoothstep } from "../math";
import { buildInnerWorld } from "./scene";
import { needsFrames, parseShapeIndex, phaseFor, type StagePhase } from "./state";

/**
 * Runs an inner page's scene: forms the shape in the hero and idles while the hero is on
 * screen; dims and freezes as it leaves; moves the one canvas into an echo host (the closing
 * CTA band) to re-form small there; draws only on demand otherwise. Reduced motion gets a
 * still frame of the finished shape. Returns a disposer.
 */
export interface InnerSceneOptions {
  stage: HTMLElement;
  host: HTMLElement;
  echoes: readonly HTMLElement[];
  config: ResolvedScene;
  tier: QualityTier;
}

const WIDE_QUERY = "(min-width: 1024px)";
const STILL_TIME = 6;

export const startInnerScene = async (options: InnerSceneOptions): Promise<() => void> => {
  const { stage, host, echoes, config, tier } = options;
  const world = buildInnerWorld(stage, host, config, tier);
  const { renderer, scene, camera, root, particles, lines, stars, nebula } = world;
  const animator = createAnimator(particles.uniforms, tier.animate);
  const input = createStageInput(stage, () => renderer.domElement, tier.animate);
  const rest = { z: 7.4, x: 0 };
  let pitchGoal = 0;
  let pitch = 0;
  const visibleEchoes = new Set<HTMLElement>();
  let current = host;
  let phase: StagePhase = "live";
  let heroRatio = 1;
  let time = tier.animate ? 0 : STILL_TIME;
  let raf = 0;
  let last = 0;

  const place = () => {
    const width = current.clientWidth;
    const height = current.clientHeight;
    const wide = current === host && globalThis.matchMedia(WIDE_QUERY).matches;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.fov = wide ? 40 : 50;
    rest.z = wide ? 7.4 : 5.8;
    rest.x = wide ? 2.1 : 0;
    camera.position.set(0, 0.2, rest.z);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    root.position.set(rest.x, 0, 0);
    particles.uniforms.uAspect.value = camera.aspect;
    if (nebula) {
      const ratio = renderer.getPixelRatio();
      nebula.visible = wide;
      nebula.material.uniforms.uResolution.value.set(width * ratio, height * ratio);
    }
  };

  const render = () => {
    particles.uniforms.uTime.value = time;
    stars.uniforms.uTime.value = time;
    if (lines) {
      lines.uniforms.uTime.value = time;
      lines.uniforms.uForm.value = particles.uniforms.uForm.value;
      lines.uniforms.uAngle.value = particles.uniforms.uAngle.value;
      // The structure belongs to the hero shape; it fades as the stage morphs away from it.
      lines.uniforms.uLineMix.value = 1 - smoothstep(0, 0.5, particles.uniforms.uShape.value);
    }
    if (nebula) {
      nebula.material.uniforms.uTime.value = time;
    }
    renderer.render(scene, camera);
  };

  /**
   * The stage's response to the visitor: looks down on the shape by its pitch, leans towards
   * the pointer, and as the hero scrolls away turns the scene and brings the camera in.
   */
  const lean = (dt: number) => {
    const onHero = current === host;
    const { x, y, near, scroll } = input.step(dt, onHero);
    pitch = tier.animate ? damp(pitch, pitchGoal, 3, dt) : pitchGoal;
    root.rotation.x = pitch - y * 0.12 + scroll * 0.2;
    root.rotation.y = x * 0.28 + scroll * 0.6;
    // Sinks a little as the hero rises, so the scene stays clear of the sticky header.
    root.position.set(rest.x, -scroll * 0.5, 0);
    camera.position.z = rest.z - scroll * 1;
    particles.uniforms.uPointer.value.set(x, y);
    particles.uniforms.uPointerMix.value = onHero ? near : 0;
  };

  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    time += dt;
    animator.step(time, dt);
    lean(dt);
    render();
    raf = needsFrames(phase, tier.animate, animator.settling()) ? requestAnimationFrame(tick) : 0;
  };

  const run = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    if (!tier.animate) {
      animator.step(time, 0);
      lean(0);
      render();
    } else if (!document.hidden && needsFrames(phase, tier.animate, animator.settling())) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };

  const setShape = (index: number) => {
    const shape = SHAPES[config.shapes[index]];
    pitchGoal = shape.pitch ?? 0;
    animator.setShape(index, shape.motion);
  };

  const moveTo = (target: HTMLElement) => {
    current = target;
    target.append(renderer.domElement);
    place();
    if (target === host) {
      setShape(0);
    } else {
      setShape(parseShapeIndex(target.dataset.stageShape, config.shapes.length));
      animator.form(time);
    }
  };

  const update = () => {
    const [echo] = visibleEchoes;
    phase = phaseFor(heroRatio, Boolean(echo));
    if (phase === "echo" && echo !== current) {
      moveTo(echo);
    } else if (phase !== "echo" && current !== host) {
      moveTo(host);
    }
    stage.dataset.scenePhase = phase;
    run();
  };

  const heroWatch = new IntersectionObserver(
    ([entry]) => {
      heroRatio = entry.isIntersecting ? entry.intersectionRatio : 0;
      update();
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] }
  );
  const echoWatch = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          visibleEchoes.add(target as HTMLElement);
        } else {
          visibleEchoes.delete(target as HTMLElement);
        }
      });
      update();
    },
    { threshold: 0.2 }
  );
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  const onResize = () => {
    globalThis.clearTimeout(resizeTimer);
    resizeTimer = globalThis.setTimeout(() => {
      place();
      render();
    }, 150);
  };
  const stopHighlights = listenForHighlights((tag) => {
    animator.setHighlight(tag);
    run();
  });

  setShape(0);
  place();
  await renderer.compileAsync(scene, camera);
  render();
  stage.dataset.scene = "ready";
  heroWatch.observe(stage);
  echoes.forEach((echo) => echoWatch.observe(echo));
  window.addEventListener("resize", onResize, { passive: true });
  document.addEventListener("visibilitychange", run);
  run();

  return () => {
    cancelAnimationFrame(raf);
    globalThis.clearTimeout(resizeTimer);
    heroWatch.disconnect();
    echoWatch.disconnect();
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", run);
    stopHighlights();
    input.dispose();
    world.dispose();
    delete stage.dataset.scene;
    delete stage.dataset.scenePhase;
  };
};
