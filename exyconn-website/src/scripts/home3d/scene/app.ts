import { clamp, damp } from "../math";
import { adaptPixelRatio, COMPACT_WIDTH, type QualityTier } from "../quality";
import { activeChapter } from "../story";
import { buildScene } from "./build";
import { applyFrame, type Motion } from "./frame";
import { measureChapters, scrollTargets, trackPointer, type Pointer } from "./input";

/**
 * Runs the home scene: one renderer, one requestAnimationFrame loop that only runs while
 * the stage is on screen and the tab is visible, and a still frame per chapter for readers
 * who asked for reduced motion. Returns a disposer.
 */
export interface SceneOptions {
  stage: HTMLElement;
  host: HTMLElement;
  chapters: HTMLElement[];
  tier: QualityTier;
}

const STILL_TIME = 8;
const WARMUP_FRAMES = 60;
const SAMPLE_FRAMES = 90;

export const startScene = ({ stage, host, chapters, tier }: SceneOptions): (() => void) => {
  let compact = host.clientWidth < COMPACT_WIDTH;
  const built = buildScene(stage, host, tier, compact);
  const { renderer, scene, stage: world } = built;
  const pointer: Pointer = { x: 0, y: 0 };
  let model = measureChapters(chapters);
  const initial = scrollTargets(model, window.scrollY);
  const motion: Motion = {
    time: tier.animate ? 0 : STILL_TIME,
    story: initial.story,
    blueprint: initial.blueprint,
    pointerX: 0,
    pointerY: 0,
    lean: 0,
    scrollY: window.scrollY,
    viewportHeight: model.viewportHeight,
  };
  let pixelRatio = tier.pixelRatio;
  let frame = 0;
  let sampled = 0;
  let last = performance.now();
  let raf = 0;
  let onScreen = true;
  let lastStill = "";

  const render = () => {
    applyFrame(world, motion, compact);
    renderer.render(scene, world.camera);
  };

  const resize = () => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    compact = width < COMPACT_WIDTH;
    renderer.setSize(width, height, false);
    world.camera.aspect = width / Math.max(1, height);
    world.camera.fov = compact ? 50 : 40;
    world.camera.updateProjectionMatrix();
    const sky = world.backdrop.nebula.material.uniforms;
    sky.uResolution.value.set(width * pixelRatio, height * pixelRatio);
    sky.uScrimSide.value.set(compact ? 0 : 1, compact ? 1 : 0);
    model = measureChapters(chapters);
    motion.viewportHeight = model.viewportHeight;
  };

  const sampleFrameTime = (dt: number) => {
    frame += 1;
    if (frame <= WARMUP_FRAMES || frame > WARMUP_FRAMES + SAMPLE_FRAMES * 2) {
      return;
    }
    sampled += dt;
    if ((frame - WARMUP_FRAMES) % SAMPLE_FRAMES === 0) {
      const next = adaptPixelRatio(
        (sampled / SAMPLE_FRAMES) * 1000,
        pixelRatio,
        tier.minPixelRatio
      );
      sampled = 0;
      if (next !== pixelRatio) {
        pixelRatio = next;
        built.setPixelRatio(next);
        resize();
      }
    }
  };

  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const scrollY = window.scrollY;
    const target = scrollTargets(model, scrollY);
    const velocity = dt > 0 ? (scrollY - motion.scrollY) / dt : 0;
    motion.time += dt;
    motion.scrollY = scrollY;
    motion.story = damp(motion.story, target.story, 3.2, dt);
    motion.blueprint = damp(motion.blueprint, target.blueprint, 4, dt);
    motion.pointerX = damp(motion.pointerX, pointer.x, 2.5, dt);
    motion.pointerY = damp(motion.pointerY, pointer.y, 2.5, dt);
    motion.lean = damp(motion.lean, clamp(velocity * 0.00004, -0.12, 0.12), 3, dt);
    render();
    sampleFrameTime(dt);
    raf = requestAnimationFrame(tick);
  };

  const setRunning = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    if (tier.animate && onScreen && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };

  /** Reduced motion: a composed still per chapter, redrawn only when the chapter changes. */
  const renderStill = () => {
    const target = scrollTargets(model, window.scrollY);
    const key = `${activeChapter(target.story)}:${Math.round(target.blueprint)}`;
    if (key === lastStill) {
      return;
    }
    lastStill = key;
    motion.story = activeChapter(target.story);
    motion.blueprint = Math.round(target.blueprint) * 0.6;
    render();
  };

  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  const onResize = () => {
    globalThis.clearTimeout(resizeTimer);
    resizeTimer = globalThis.setTimeout(() => {
      resize();
      lastStill = "";
      if (!tier.animate) {
        renderStill();
      }
    }, 150);
  };
  const onScroll = () => renderStill();
  const visibility = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    setRunning();
  });

  resize();
  render();
  stage.dataset.scene = "ready";
  visibility.observe(stage);
  window.addEventListener("resize", onResize, { passive: true });
  document.addEventListener("visibilitychange", setRunning);
  const stopPointer = tier.animate ? trackPointer(pointer) : () => undefined;
  if (tier.animate) {
    setRunning();
  } else {
    window.addEventListener("scroll", onScroll, { passive: true });
    renderStill();
  }

  return () => {
    cancelAnimationFrame(raf);
    globalThis.clearTimeout(resizeTimer);
    visibility.disconnect();
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("visibilitychange", setRunning);
    stopPointer();
    built.dispose();
    delete stage.dataset.scene;
  };
};
