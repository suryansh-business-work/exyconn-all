// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  measureChapters,
  scrollTargets,
  trackPointer,
  type Pointer,
} from "../../../../../src/scripts/home3d/scene/input";

const chapterAt = (top: number): HTMLElement => {
  const chapter = document.createElement("section");
  vi.spyOn(chapter, "getBoundingClientRect").mockReturnValue({ top } as DOMRect);
  return chapter;
};

const move = (clientX: number, clientY: number, pointerType: string) =>
  globalThis.dispatchEvent(
    Object.assign(new MouseEvent("pointermove", { clientX, clientY }), { pointerType })
  );

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("measureChapters", () => {
  it("anchors the first chapter at 0 and the rest where their top meets mid-viewport", () => {
    vi.stubGlobal("innerHeight", 1000);
    vi.stubGlobal("scrollY", 200);
    const model = measureChapters([chapterAt(-200), chapterAt(1500), chapterAt(2600)]);
    expect(model).toEqual({ anchors: [0, 1200, 2300], blend: 800, viewportHeight: 1000 });
  });
});

describe("scrollTargets", () => {
  const model = { anchors: [0, 1200, 2300], blend: 800, viewportHeight: 1000 };

  it("opens on the blueprint of the first chapter", () => {
    expect(scrollTargets(model, 0)).toEqual({ story: 0, blueprint: 1 });
  });

  it("holds a chapter, then morphs into the next inside the blend window", () => {
    expect(scrollTargets(model, 300).story).toBe(0);
    expect(scrollTargets(model, 800).story).toBeCloseTo(0.5);
    expect(scrollTargets(model, 1200)).toEqual({ story: 1, blueprint: 0 });
  });

  it("materialises the hero over the first 55% of a viewport", () => {
    expect(scrollTargets(model, 275).blueprint).toBeCloseTo(0.5);
    expect(scrollTargets(model, 550).blueprint).toBe(0);
  });
});

describe("trackPointer", () => {
  it("maps the mouse to [-1, 1] with y pointing up, ignores touch and stops on dispose", () => {
    vi.stubGlobal("innerWidth", 1000);
    vi.stubGlobal("innerHeight", 500);
    const pointer: Pointer = { x: 0, y: 0 };
    const stop = trackPointer(pointer);

    move(750, 125, "mouse");
    expect(pointer).toEqual({ x: 0.5, y: 0.5 });

    move(0, 500, "touch");
    expect(pointer).toEqual({ x: 0.5, y: 0.5 });

    stop();
    move(0, 0, "mouse");
    expect(pointer).toEqual({ x: 0.5, y: 0.5 });
  });
});
