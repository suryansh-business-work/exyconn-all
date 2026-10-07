// @vitest-environment jsdom
/** The visitor's pointer and scroll, smoothed for the inner stage's frame loop. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStageInput, heroScroll } from "../../../../../src/scripts/stage3d/inner/interaction";

/** Long enough for every damped value to land on its goal. */
const SETTLE = 20;

const rect = (left: number, top: number, width: number, height: number): DOMRect =>
  DOMRect.fromRect({ x: left, y: top, width, height });

let stage: HTMLElement;
let canvas: HTMLElement;
let inputs: ReturnType<typeof createStageInput>[];

const make = (enabled: boolean) => {
  const input = createStageInput(stage, () => canvas, enabled);
  inputs.push(input);
  return input;
};

const move = (clientX: number, clientY: number, pointerType = "mouse") =>
  globalThis.dispatchEvent(new PointerEvent("pointermove", { clientX, clientY, pointerType }));

beforeEach(() => {
  inputs = [];
  stage = document.createElement("section");
  canvas = document.createElement("canvas");
  vi.spyOn(stage, "getBoundingClientRect").mockReturnValue(rect(0, 0, 400, 200));
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue(rect(100, 50, 200, 100));
});

afterEach(() => {
  inputs.forEach((input) => input.dispose());
  vi.restoreAllMocks();
});

describe("heroScroll", () => {
  it("runs from 0 with the hero on screen to 1 once it has gone", () => {
    expect(heroScroll(0, 500)).toBe(0);
    expect(heroScroll(-250, 500)).toBe(0.5);
    expect(heroScroll(-900, 500)).toBe(1);
  });

  it("stays at 0 below the top and survives a zero height", () => {
    expect(heroScroll(120, 500)).toBe(0);
    expect(heroScroll(-0.5, 0)).toBe(0.5);
  });
});

describe("createStageInput", () => {
  it("leans towards a mouse over the canvas, in NDC", () => {
    const input = make(true);
    move(250, 75);
    const now = input.step(SETTLE, true);
    expect(now.x).toBeCloseTo(0.5);
    expect(now.y).toBeCloseTo(0.5);
    expect(now.near).toBeCloseTo(1);
  });

  it("eases towards the pointer rather than jumping", () => {
    const input = make(true);
    move(300, 50);
    const now = input.step(0.1, true);
    expect(now.x).toBeCloseTo(1 - Math.exp(-0.4));
    expect(now.near).toBeCloseTo(1 - Math.exp(-0.6));
  });

  it("clamps a pointer beyond the canvas and is no longer near", () => {
    const input = make(true);
    move(700, 400);
    const now = input.step(SETTLE, true);
    expect(now.x).toBeCloseTo(1);
    expect(now.y).toBeCloseTo(-1);
    expect(now.near).toBeCloseTo(0);
  });

  it("ignores touch, where a drag is a scroll", () => {
    const input = make(true);
    move(250, 75, "touch");
    const now = input.step(SETTLE, true);
    expect(now).toEqual({ x: 0, y: 0, near: 0, scroll: 0 });
  });

  it("returns to rest when the pointer leaves the page", () => {
    const input = make(true);
    move(250, 75);
    input.step(SETTLE, true);
    document.documentElement.dispatchEvent(new PointerEvent("pointerleave"));
    const now = input.step(SETTLE, true);
    expect(now.x).toBeCloseTo(0);
    expect(now.y).toBeCloseTo(0);
    expect(now.near).toBeCloseTo(0);
  });

  it("guards a canvas with no size against dividing by zero", () => {
    vi.mocked(canvas.getBoundingClientRect).mockReturnValue(rect(0, 0, 0, 0));
    const input = make(true);
    move(0, 0);
    const now = input.step(SETTLE, true);
    expect(now.x).toBeCloseTo(-1);
    expect(now.y).toBeCloseTo(1);
    expect(now.near).toBeCloseTo(1);
  });

  it("follows the hero's scroll only while the canvas is on the hero", () => {
    vi.mocked(stage.getBoundingClientRect).mockReturnValue(rect(0, -100, 400, 200));
    const input = make(true);
    expect(input.step(SETTLE, true).scroll).toBeCloseTo(0.5);
    expect(input.step(SETTLE, false).scroll).toBeCloseTo(0);
  });

  it("listens to nothing and stays at rest when motion is reduced", () => {
    const add = vi.spyOn(globalThis, "addEventListener");
    vi.mocked(stage.getBoundingClientRect).mockReturnValue(rect(0, -100, 400, 200));
    const input = make(false);
    move(250, 75);
    expect(add).not.toHaveBeenCalledWith("pointermove", expect.any(Function), expect.anything());
    expect(input.step(SETTLE, true)).toEqual({ x: 0, y: 0, near: 0, scroll: 0 });
    expect(stage.getBoundingClientRect).not.toHaveBeenCalled();
  });

  it("stops following the pointer once disposed", () => {
    const input = make(true);
    input.dispose();
    move(250, 75);
    expect(input.step(SETTLE, true)).toEqual({ x: 0, y: 0, near: 0, scroll: 0 });
  });
});
