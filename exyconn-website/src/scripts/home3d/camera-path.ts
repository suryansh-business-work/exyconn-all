import { clamp, lerp } from "./math";
import { LAST_CHAPTER } from "./story";

/**
 * Where the camera and the protagonist sit in each chapter. Wide screens push the subject
 * right so the reading column on the left stays clear; compact screens centre it in the
 * upper half, above the text panels.
 */
export interface Pose {
  /** Camera position. */
  camera: readonly [number, number, number];
  /** Protagonist offset in the frame. */
  offset: readonly [number, number];
  /** Protagonist yaw and pitch, radians. */
  yaw: number;
  pitch: number;
  scale: number;
}

const WIDE: readonly Pose[] = [
  { camera: [0, 0.3, 7.4], offset: [1.9, 0], yaw: 0, pitch: 0, scale: 1 },
  { camera: [-0.6, 1.6, 7.6], offset: [1.7, 0.1], yaw: -2.35, pitch: 0.42, scale: 0.6 },
  { camera: [0.8, 1.2, 7.8], offset: [1.9, 0.2], yaw: 0.35, pitch: 0.18, scale: 0.6 },
  { camera: [0, 0.8, 8.2], offset: [1.9, 0.1], yaw: 0.2, pitch: 0.05, scale: 0.62 },
  { camera: [0, 0, 7], offset: [0, 0.55], yaw: 0, pitch: 0, scale: 0.9 },
];

const COMPACT: readonly Pose[] = [
  { camera: [0, 0.2, 9.6], offset: [0, 1.75], yaw: 0, pitch: 0, scale: 0.8 },
  { camera: [-0.3, 1.5, 10.4], offset: [0, 1.8], yaw: -2.35, pitch: 0.42, scale: 0.42 },
  { camera: [0.3, 1.1, 10.4], offset: [0, 1.75], yaw: 0.35, pitch: 0.18, scale: 0.5 },
  { camera: [0, 0.7, 10.6], offset: [0, 1.8], yaw: 0.2, pitch: 0.05, scale: 0.46 },
  { camera: [0, 0, 9.6], offset: [0, 1.6], yaw: 0, pitch: 0, scale: 0.8 },
];

const mix3 = (
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number
): [number, number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export const poseAt = (story: number, compact: boolean): Pose => {
  const poses = compact ? COMPACT : WIDE;
  const position = clamp(story, 0, LAST_CHAPTER);
  const from = Math.min(Math.floor(position), LAST_CHAPTER - 1);
  const t = position - from;
  const a = poses[from];
  const b = poses[from + 1];
  return {
    camera: mix3(a.camera, b.camera, t),
    offset: [lerp(a.offset[0], b.offset[0], t), lerp(a.offset[1], b.offset[1], t)],
    yaw: lerp(a.yaw, b.yaw, t),
    pitch: lerp(a.pitch, b.pitch, t),
    scale: lerp(a.scale, b.scale, t),
  };
};
