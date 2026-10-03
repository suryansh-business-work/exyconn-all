import { Matrix3, Matrix4, Vector2, Vector3, type IUniform } from "three";
import type { Rgb } from "./palette";

/**
 * Small adapters between the pure modules and three's uniform objects. Colours stay in the
 * sRGB the page painted them in: the custom shaders write them out unconverted.
 */
export const vec3 = ([x, y, z]: readonly number[]): Vector3 => new Vector3(x, y, z);

export const colorUniform = (rgb: Rgb): IUniform<Vector3> => ({ value: vec3(rgb) });

export const setColor = (target: Vector3, rgb: Rgb): void => {
  target.set(rgb[0], rgb[1], rgb[2]);
};

/** Weighted blend of colours into `target` (weights should sum to 1). */
export const blendColors = (
  target: Vector3,
  colors: readonly Rgb[],
  weights: readonly number[]
): void => {
  target.set(0, 0, 0);
  colors.forEach((rgb, index) => {
    target.x += rgb[0] * weights[index];
    target.y += rgb[1] * weights[index];
    target.z += rgb[2] * weights[index];
  });
};

export const tiltMatrix = (x: number, z: number): Matrix3 =>
  new Matrix3().setFromMatrix4(
    new Matrix4().makeRotationZ(z).multiply(new Matrix4().makeRotationX(x))
  );

export const resolution = (): IUniform<Vector2> => ({ value: new Vector2(1, 1) });
