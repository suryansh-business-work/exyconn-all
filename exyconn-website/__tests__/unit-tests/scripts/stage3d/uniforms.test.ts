import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import {
  blendColors,
  colorUniform,
  resolution,
  setColor,
  tiltMatrix,
  vec3,
} from "../../../../src/scripts/stage3d/uniforms";

const xyz = (vector: Vector3) => [vector.x, vector.y, vector.z];

describe("vec3 and colour uniforms", () => {
  it("turns a triple into a vector and wraps a colour as a uniform", () => {
    expect(xyz(vec3([1, 2, 3]))).toEqual([1, 2, 3]);
    expect(xyz(colorUniform([0.1, 0.2, 0.3]).value)).toEqual([0.1, 0.2, 0.3]);
  });

  it("writes a colour into an existing vector in place", () => {
    const target = new Vector3(9, 9, 9);
    setColor(target, [0.25, 0.5, 0.75]);
    expect(xyz(target)).toEqual([0.25, 0.5, 0.75]);
  });
});

describe("blendColors", () => {
  it("mixes colours by weight, replacing what the target held", () => {
    const target = new Vector3(5, 5, 5);
    blendColors(
      target,
      [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      [0.5, 0.25, 0.25]
    );
    expect(xyz(target)).toEqual([0.5, 0.25, 0.25]);
  });

  it("gives one colour back unchanged at full weight", () => {
    const target = new Vector3();
    blendColors(
      target,
      [
        [0.2, 0.4, 0.6],
        [1, 1, 1],
      ],
      [1, 0]
    );
    expect(xyz(target)).toEqual([0.2, 0.4, 0.6]);
  });
});

describe("tiltMatrix", () => {
  it("rotates about x first, then about z", () => {
    const tilted = new Vector3(0, 1, 0).applyMatrix3(tiltMatrix(Math.PI / 2, Math.PI / 2));
    // x by 90° takes +y to +z; z by 90° then leaves +z where it is.
    expect(tilted.x).toBeCloseTo(0);
    expect(tilted.y).toBeCloseTo(0);
    expect(tilted.z).toBeCloseTo(1);

    const sideways = new Vector3(1, 0, 0).applyMatrix3(tiltMatrix(Math.PI / 2, Math.PI / 2));
    expect(sideways.y).toBeCloseTo(1);
  });

  it("is the identity with no tilt", () => {
    // `+ 0` folds the -0 of sin(0) terms into 0.
    expect(tiltMatrix(0, 0).elements.map((value) => value + 0)).toEqual([
      1, 0, 0, 0, 1, 0, 0, 0, 1,
    ]);
  });
});

describe("resolution", () => {
  it("starts each canvas uniform at one pixel, as a fresh vector", () => {
    const first = resolution();
    expect(first.value.toArray()).toEqual([1, 1]);
    expect(resolution().value).not.toBe(first.value);
  });
});
