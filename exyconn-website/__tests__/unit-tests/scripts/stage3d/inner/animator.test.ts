/** The protagonist's uniform driver: settling, highlight hand-over and idle motion. */
import { describe, expect, it } from "vitest";
import { createAnimator } from "../../../../../src/scripts/stage3d/inner/animator";
import { FORM_SECONDS, HIGHLIGHT_SECONDS } from "../../../../../src/scripts/stage3d/inner/state";

const FRAME = 1 / 60;

const uniforms = () => ({
  uForm: { value: 0 },
  uShape: { value: 0 },
  uAngle: { value: 0 },
  uHighlight: { value: -1 },
  uHighlightMix: { value: 0 },
});

type Animator = ReturnType<typeof createAnimator>;

/** Steps `animator` from `from` for `seconds` in 60 Hz frames; returns the end time. */
const run = (animator: Animator, from: number, seconds: number): number => {
  let time = from;
  for (let i = 0; i < Math.round(seconds * 60); i += 1) {
    time += FRAME;
    animator.step(time, FRAME);
  }
  return time;
};

/** An animated animator that has finished its first form. */
const settled = () => {
  const u = uniforms();
  const animator = createAnimator(u, true);
  const time = run(animator, 0, FORM_SECONDS + 0.5);
  return { u, animator, time };
};

describe("createAnimator", () => {
  it("is half formed half way through the form time", () => {
    const u = uniforms();
    const animator = createAnimator(u, true);
    animator.form(10);
    animator.step(10 + FORM_SECONDS / 2, 0);
    expect(u.uForm.value).toBeCloseTo(0.5);
    expect(animator.settling()).toBe(true);
  });

  it("settles only once a requested highlight has fully come up", () => {
    const { u, animator, time } = settled();
    expect(animator.settling()).toBe(false);
    animator.setHighlight(3);
    expect(u.uHighlight.value).toBe(3);
    expect(animator.settling()).toBe(true);
    run(animator, time, HIGHLIGHT_SECONDS + 0.1);
    expect(u.uHighlightMix.value).toBe(1);
    expect(animator.settling()).toBe(false);
  });

  it("keeps the old tag lit while it fades out, then clears it", () => {
    const { u, animator, time } = settled();
    animator.setHighlight(3);
    const lit = run(animator, time, 1);
    animator.setHighlight(-1);
    expect(u.uHighlight.value).toBe(3);
    animator.step(lit + 0.1, 0.1);
    expect(u.uHighlightMix.value).toBeCloseTo(1 - 0.1 / HIGHLIGHT_SECONDS);
    expect(u.uHighlight.value).toBe(3);
    run(animator, lit + 0.1, 1);
    expect(u.uHighlightMix.value).toBe(0);
    expect(u.uHighlight.value).toBe(-1);
  });

  it("swaps straight to a new tag while one is lit", () => {
    const { u, animator, time } = settled();
    animator.setHighlight(1);
    run(animator, time, 1);
    animator.setHighlight(4);
    expect(u.uHighlight.value).toBe(4);
    expect(u.uHighlightMix.value).toBe(1);
  });

  it("morphs part way, then snaps exactly onto the target shape", () => {
    const { u, animator, time } = settled();
    animator.setShape(2, "spin");
    animator.step(time + 0.1, 0.1);
    expect(u.uShape.value).toBeGreaterThan(0);
    expect(u.uShape.value).toBeLessThan(2);
    run(animator, time + 0.1, 5);
    expect(u.uShape.value).toBe(2);
    expect(animator.settling()).toBe(false);
  });

  it("sways a flat shape either side without turning it round", () => {
    const u = uniforms();
    const animator = createAnimator(u, true);
    animator.setShape(0, "sway");
    const time = run(animator, 0, 12);
    expect(u.uAngle.value).toBeCloseTo(0.3 * Math.sin(time * 0.35), 3);
    expect(Math.abs(u.uAngle.value)).toBeLessThanOrEqual(0.3);
  });

  it("keeps every shape still under reduced motion", () => {
    const u = uniforms();
    const animator = createAnimator(u, false);
    animator.setShape(1, "sway");
    animator.step(4, 1);
    animator.step(9, 1);
    expect(u.uAngle.value).toBe(0);
    expect(u.uShape.value).toBe(1);
    expect(u.uForm.value).toBe(1);
    expect(u.uHighlight.value).toBe(-1);
  });
});
