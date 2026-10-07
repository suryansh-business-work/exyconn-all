// @vitest-environment jsdom
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Scene } from "three";
import { describe, expect, it, vi } from "vitest";
import {
  createRenderer,
  disposeObject,
  disposeScene,
} from "../../../../src/scripts/stage3d/renderer";

// jsdom has no WebGL, so the renderer is a stand-in with the same surface the stage uses.
vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof import("three")>();
  class FakeRenderer {
    readonly domElement = document.createElement("canvas");
    readonly setPixelRatio = vi.fn();
    readonly dispose = vi.fn();
    constructor(readonly parameters: unknown) {}
  }
  return { ...actual, WebGLRenderer: FakeRenderer };
});

interface FakeRenderer {
  parameters: unknown;
  domElement: HTMLCanvasElement;
  setPixelRatio: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
}
const fake = (renderer: unknown) => renderer as FakeRenderer;

describe("createRenderer", () => {
  it("adds an opaque, unantialiased canvas hidden from assistive tech to the host", () => {
    const host = document.createElement("div");
    const renderer = fake(createRenderer(host, 1.25));
    expect(renderer.parameters).toEqual({ antialias: false, alpha: false });
    expect(renderer.setPixelRatio).toHaveBeenCalledWith(1.25);
    expect(renderer.domElement.getAttribute("aria-hidden")).toBe("true");
    expect(host.firstElementChild).toBe(renderer.domElement);
  });

  it("can draw on a transparent canvas", () => {
    const renderer = fake(createRenderer(document.createElement("div"), 1, true));
    expect(renderer.parameters).toEqual({ antialias: false, alpha: true });
  });
});

describe("disposeObject", () => {
  it("frees an object's geometry and material", () => {
    const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    const geometry = vi.spyOn(mesh.geometry, "dispose");
    const material = vi.spyOn(mesh.material, "dispose");
    disposeObject(mesh);
    expect(geometry).toHaveBeenCalledTimes(1);
    expect(material).toHaveBeenCalledTimes(1);
  });

  it("passes over objects that hold neither", () => {
    expect(() => disposeObject(new Group())).not.toThrow();
  });
});

describe("disposeScene", () => {
  it("frees every object in the tree, the context and the canvas", () => {
    const host = document.createElement("div");
    const renderer = createRenderer(host, 1);
    const scene = new Scene();
    const nested = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    const group = new Group();
    group.add(nested);
    scene.add(group, new Mesh(new BoxGeometry(), new MeshBasicMaterial()));
    const freed = vi.spyOn(nested.geometry, "dispose");
    disposeScene(scene, renderer);
    expect(freed).toHaveBeenCalled();
    expect(fake(renderer).dispose).toHaveBeenCalledTimes(1);
    expect(host.children).toHaveLength(0);
  });
});
