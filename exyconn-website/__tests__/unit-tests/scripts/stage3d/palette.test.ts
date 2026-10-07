// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readPalette, readRoles } from "../../../../src/scripts/stage3d/palette";

const tokens = vi.hoisted(() => ({
  roleVar: vi.fn((role: string) => `var(--color-${role})`),
}));
vi.mock("../../../../src/styles/tokens/semantic.tokens", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  roleVar: tokens.roleVar,
}));

/** A 2D context that "paints" an rgb() string and reads its channels back. */
const paintContext = () => {
  const context = {
    fillStyle: "",
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    getImageData: vi.fn(() => {
      const channels = (/rgb\((\d+), (\d+), (\d+)\)/.exec(context.fillStyle) ?? [])
        .slice(1)
        .map(Number);
      return { data: Uint8ClampedArray.from([...channels, 255]) };
    }),
  };
  return context;
};

/** getComputedStyle answering one rgb() per probe read, in order. */
const computedColors = (colors: readonly string[]) => {
  let read = 0;
  vi.stubGlobal(
    "getComputedStyle",
    vi.fn(() => ({ color: colors[read++] }))
  );
};

/** Every canvas answers `getContext` with `context`. */
const canvasGives = (context: unknown) =>
  vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue(context as RenderingContext | null);

let stage: HTMLElement;

beforeEach(() => {
  stage = document.createElement("div");
  document.body.append(stage);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  tokens.roleVar.mockClear();
  stage.remove();
});

describe("readRoles", () => {
  it("resolves each role as the element paints it into sRGB channels", () => {
    const getContext = canvasGives(paintContext());
    computedColors(["rgb(255, 0, 51)", "rgb(0, 102, 255)"]);
    const colors = readRoles(stage, { accent: "violet", glow: "cyan-bright" });
    expect(colors).toEqual({ accent: [1, 0, 0.2], glow: [0, 0.4, 1] });
    expect(tokens.roleVar.mock.calls).toEqual([["violet"], ["cyan-bright"]]);
    expect(getContext).toHaveBeenCalledWith("2d", { willReadFrequently: true });
  });

  it("measures inside the element and leaves nothing behind", () => {
    canvasGives(paintContext());
    const probes: Element[] = [];
    vi.stubGlobal(
      "getComputedStyle",
      vi.fn((probe: Element) => {
        probes.push(probe);
        expect(probe.parentElement).toBe(stage);
        return { color: "rgb(0, 0, 0)" };
      })
    );
    readRoles(stage, { ink: "fg" });
    expect(probes).toHaveLength(1);
    expect(stage.children).toHaveLength(0);
  });

  it("answers black when the browser gives no 2D canvas", () => {
    canvasGives(null);
    computedColors(["rgb(255, 255, 255)"]);
    expect(readRoles(stage, { ink: "fg" })).toEqual({ ink: [0, 0, 0] });
  });
});

describe("readPalette", () => {
  it("reads the home scene's nine colour roles", () => {
    canvasGives(paintContext());
    computedColors(Array.from({ length: 9 }, () => "rgb(51, 51, 51)"));
    const palette = readPalette(stage);
    expect(Object.keys(palette)).toEqual([
      "deep",
      "mid",
      "violet",
      "fuchsia",
      "cyan",
      "sky",
      "amber",
      "orange",
      "line",
    ]);
    expect(palette.line).toEqual([0.2, 0.2, 0.2]);
    expect(tokens.roleVar.mock.calls.map(([role]) => role)).toEqual([
      "inverse",
      "indigo-night",
      "violet",
      "fuchsia",
      "cyan-bright",
      "sky-bright",
      "amber-bright",
      "orange",
      "fg",
    ]);
  });
});
