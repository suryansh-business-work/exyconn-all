import { clamp } from "../math";
import type { ShapeMotion } from "../shapes/registry";

/**
 * The inner stage's decisions, kept pure so they are tested without a browser.
 *
 * - live: the hero is mostly on screen — the scene animates (idle spin).
 * - dimmed: the hero is leaving — the canvas fades to a quarter and freezes.
 * - echo: the hero is gone and an echo host (the closing CTA band, an opt-in mid-page
 *   figure) is in view — the canvas moves there, re-forms small, then freezes.
 * - parked: nothing to show — no frames at all.
 */
export type StagePhase = "live" | "dimmed" | "echo" | "parked";

/** Below this share of the hero on screen, the scene dims and freezes. */
export const LIVE_RATIO = 0.5;
/**
 * How long the hero takes to build, seconds. Long enough to read as a story — the racks,
 * then the streams, then the chart — rather than a flash.
 */
export const FORM_SECONDS = 2.8;
/** How long a highlight takes to come up or go down, seconds. */
export const HIGHLIGHT_SECONDS = 0.35;

export const phaseFor = (heroRatio: number, echoVisible: boolean): StagePhase => {
  if (heroRatio >= LIVE_RATIO) {
    return "live";
  }
  if (echoVisible) {
    return "echo";
  }
  return heroRatio > 0 ? "dimmed" : "parked";
};

/** Seconds since the form began → uForm, 0 (scattered) to 1 (formed). */
export const formAmount = (elapsed: number): number => clamp(elapsed / FORM_SECONDS);

/** A `data-stage-highlight` value → a tag, or −1 for none. */
export const parseHighlight = (value: string | null | undefined): number => {
  const tag = Number.parseInt(value ?? "", 10);
  return Number.isFinite(tag) && tag >= 0 ? tag : -1;
};

/** A `data-stage-shape` value → a shape index within the scene's shapes. */
export const parseShapeIndex = (value: string | null | undefined, shapes: number): number => {
  const index = Number.parseInt(value ?? "", 10);
  return Number.isFinite(index) ? clamp(index, 0, shapes - 1) : 0;
};

/** Frames run while live, or while a form, morph or highlight is still settling. */
export const needsFrames = (phase: StagePhase, animate: boolean, settling: boolean): boolean =>
  animate && (phase === "live" || (phase !== "parked" && settling));

/** Moves `value` towards `goal` by at most `amount`, never past it. */
export const approach = (value: number, goal: number, amount: number): number =>
  value < goal ? Math.min(goal, value + amount) : Math.max(goal, value - amount);

/** Idle motion uniforms: spin rate (rad/s) and sway amplitude (rad). */
export const idleMotion = (motion: ShapeMotion): { spin: number; sway: number } =>
  motion === "spin" ? { spin: 0.1, sway: 0 } : { spin: 0, sway: 0.3 };
