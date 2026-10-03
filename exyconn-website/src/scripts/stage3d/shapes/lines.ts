import type { LineSet, Vec3 } from "./sampling";

/**
 * Collects a shape's structure as line segments: building edges, rack frames, chart axes and
 * the data links between them. Each segment carries the build order it appears at, and a
 * link is flagged to carry packets that run from its first vertex to its last.
 */
export interface LineBuilder {
  /** One straight edge, built at `order`. */
  segment: (a: Vec3, b: Vec3, order: number) => void;
  /** A polyline built from `from` to `to` along its length; `flow` makes it a data link. */
  path: (points: readonly Vec3[], from: number, to: number, flow?: boolean) => void;
  /** The 12 edges of an axis-aligned box, its base first and its top last. */
  box: (centre: Vec3, size: Vec3, from: number, to: number) => void;
  build: () => LineSet;
}

const corner = (centre: Vec3, size: Vec3, x: number, y: number, z: number): Vec3 => [
  centre[0] + (x - 0.5) * size[0],
  centre[1] + (y - 0.5) * size[1],
  centre[2] + (z - 0.5) * size[2],
];

export const createLines = (): LineBuilder => {
  const positions: number[] = [];
  const order: number[] = [];
  const flow: number[] = [];
  const along: number[] = [];

  const push = (a: Vec3, b: Vec3, at: number, isFlow: boolean, t0: number, t1: number) => {
    positions.push(...a, ...b);
    order.push(at, at);
    flow.push(isFlow ? 1 : 0, isFlow ? 1 : 0);
    along.push(t0, t1);
  };

  const segment = (a: Vec3, b: Vec3, at: number) => push(a, b, at, false, 0, 1);

  const path = (points: readonly Vec3[], from: number, to: number, isFlow = false) => {
    const last = points.length - 1;
    for (let i = 0; i < last; i += 1) {
      const t0 = i / last;
      const t1 = (i + 1) / last;
      push(points[i], points[i + 1], from + (to - from) * t0, isFlow, t0, t1);
    }
  };

  const box = (centre: Vec3, size: Vec3, from: number, to: number) => {
    const c = (x: number, y: number, z: number) => corner(centre, size, x, y, z);
    const ring = (y: number, at: number) => {
      segment(c(0, y, 0), c(1, y, 0), at);
      segment(c(1, y, 0), c(1, y, 1), at);
      segment(c(1, y, 1), c(0, y, 1), at);
      segment(c(0, y, 1), c(0, y, 0), at);
    };
    ring(0, from);
    for (const [x, z] of [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]) {
      path([c(x, 0, z), c(x, 1, z)], from, to);
    }
    ring(1, to);
  };

  const build = (): LineSet => ({
    positions: Float32Array.from(positions),
    order: Float32Array.from(order),
    flow: Float32Array.from(flow),
    along: Float32Array.from(along),
  });

  return { segment, path, box, build };
};

/** Points along a quadratic arc from `a` to `b` lifted by `lift` at the middle. */
export const arcPoints = (a: Vec3, b: Vec3, lift: number, steps = 16): Vec3[] => {
  const mid: Vec3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + lift, (a[2] + b[2]) / 2];
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return [
      u * u * a[0] + 2 * u * t * mid[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * mid[1] + t * t * b[1],
      u * u * a[2] + 2 * u * t * mid[2] + t * t * b[2],
    ] as Vec3;
  });
};
