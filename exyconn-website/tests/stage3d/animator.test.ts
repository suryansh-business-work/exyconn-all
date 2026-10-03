import { describe, expect, it } from "vitest";
import { createAnimator } from "../../src/scripts/stage3d/inner/animator";
import { FORM_SECONDS, idleMotion } from "../../src/scripts/stage3d/inner/state";

const uniforms = () => ({
  uForm: { value: 0 },
  uShape: { value: 0 },
  uAngle: { value: 0 },
  uHighlight: { value: -1 },
  uHighlightMix: { value: 0 },
});

/** Runs the animator for `seconds` in 1/60 s frames. */
const run = (animator: ReturnType<typeof createAnimator>, from: number, seconds: number) => {
  let time = from;
  for (let i = 0; i < seconds * 60; i += 1) {
    time += 1 / 60;
    animator.step(time, 1 / 60);
  }
  return time;
};

describe("scene animator", () => {
  it("gathers the swarm, morphs to a shape and settles", () => {
    const u = uniforms();
    const animator = createAnimator(u, true);
    expect(animator.settling()).toBe(true);
    let time = run(animator, 0, FORM_SECONDS + 0.1);
    expect(u.uForm.value).toBe(1);
    expect(animator.settling()).toBe(false);
    animator.setShape(1, "sway");
    expect(animator.settling()).toBe(true);
    time = run(animator, time, 4);
    expect(u.uShape.value).toBe(1);
    animator.form(time);
    animator.step(time, 0);
    expect(u.uForm.value).toBe(0);
  });

  it("fades a highlight in and back out, then clears the tag", () => {
    const u = uniforms();
    const animator = createAnimator(u, true);
    animator.setHighlight(2);
    expect(u.uHighlight.value).toBe(2);
    const time = run(animator, 0, 1);
    expect(u.uHighlightMix.value).toBe(1);
    animator.setHighlight(-1);
    run(animator, time, 1);
    expect(u.uHighlightMix.value).toBe(0);
    expect(u.uHighlight.value).toBe(-1);
  });

  it("turns volumes and sways flat shapes", () => {
    const u = uniforms();
    const animator = createAnimator(u, true);
    run(animator, 0, 10);
    expect(u.uAngle.value).toBeGreaterThan(0.5);
    expect(idleMotion("sway")).toEqual({ spin: 0, sway: 0.3 });
  });

  it("reaches every goal at once under reduced motion", () => {
    const u = uniforms();
    const animator = createAnimator(u, false);
    animator.setShape(2, "spin");
    animator.setHighlight(1);
    animator.step(6, 0);
    expect(u).toEqual({
      uForm: { value: 1 },
      uShape: { value: 2 },
      uAngle: { value: 0 },
      uHighlight: { value: 1 },
      uHighlightMix: { value: 1 },
    });
    expect(animator.settling()).toBe(false);
  });
});
