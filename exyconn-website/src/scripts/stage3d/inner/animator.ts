import type { IUniform } from "three";
import { damp } from "../math";
import type { ShapeMotion } from "../shapes/registry";
import { approach, formAmount, HIGHLIGHT_SECONDS, idleMotion } from "./state";

/**
 * Drives the protagonist's uniforms towards their goals: the swarm gathering (uForm), the
 * morph to the target shape (uShape), the highlight fading in or out (uHighlightMix) and the
 * idle turn (uAngle, accumulated here so a change of shape never jumps the rotation). Under
 * reduced motion every goal is reached at once.
 */
/** The protagonist material's uniforms; uForm, uShape, uAngle, uHighlight(Mix) are read. */
type Uniforms = Readonly<Record<string, IUniform<number>>>;

export const createAnimator = (uniforms: Uniforms, animate: boolean) => {
  let formStart = 0;
  let shapeTarget = 0;
  let highlightTarget = -1;
  let idle = idleMotion("spin");
  let spin = 0;
  let sway = 0;
  let angle = 0;

  const highlightGoal = () => (highlightTarget >= 0 ? 1 : 0);

  return {
    /** Restart the gathering from a scatter at `time`. */
    form: (time: number) => {
      formStart = time;
    },
    setShape: (index: number, motion: ShapeMotion) => {
      shapeTarget = index;
      idle = idleMotion(motion);
    },
    setHighlight: (tag: number) => {
      highlightTarget = tag;
      if (tag >= 0) {
        uniforms.uHighlight.value = tag;
      }
    },
    settling: () =>
      uniforms.uForm.value < 1 ||
      uniforms.uShape.value !== shapeTarget ||
      uniforms.uHighlightMix.value !== highlightGoal(),
    step: (time: number, dt: number) => {
      const shape = damp(uniforms.uShape.value, shapeTarget, 3, dt);
      uniforms.uForm.value = animate ? formAmount(time - formStart) : 1;
      uniforms.uShape.value =
        !animate || Math.abs(shape - shapeTarget) < 0.001 ? shapeTarget : shape;
      uniforms.uHighlightMix.value = approach(
        uniforms.uHighlightMix.value,
        highlightGoal(),
        animate ? dt / HIGHLIGHT_SECONDS : 1
      );
      if (uniforms.uHighlightMix.value === 0) {
        uniforms.uHighlight.value = -1;
      }
      spin = animate ? damp(spin, idle.spin, 2, dt) : 0;
      sway = animate ? damp(sway, idle.sway, 2, dt) : 0;
      angle += spin * dt;
      uniforms.uAngle.value = angle + sway * Math.sin(time * 0.35);
    },
  };
};
