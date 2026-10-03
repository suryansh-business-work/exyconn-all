/**
 * Point samplers on primitive geometry. Every world (core, jet, robot, planet) is built by
 * mixing these: a part is a weight and a sampler, and `fillCloud` shares the point budget
 * between parts by weight. No meshes, no downloaded models.
 */
export type Vec3 = [number, number, number];
export type Random = () => number;
export type Sampler = (random: Random) => Vec3;

export interface Part {
  weight: number;
  sample: Sampler;
  /** Free per-part tag written beside every point (a robot joint, an orbit speed…). */
  tag?: number;
}

export interface Cloud {
  positions: Float32Array;
  tags: Float32Array;
}

const TAU = Math.PI * 2;

export const between = (random: Random, min: number, max: number): number =>
  min + (max - min) * random();

/** Uniform on a sphere's surface. */
export const onSphere = (random: Random, radius: number, center: Vec3 = [0, 0, 0]): Vec3 => {
  const z = between(random, -1, 1);
  const angle = random() * TAU;
  const ring = Math.sqrt(1 - z * z);
  return [
    center[0] + radius * ring * Math.cos(angle),
    center[1] + radius * ring * Math.sin(angle),
    center[2] + radius * z,
  ];
};

/** Uniform inside a sphere. */
export const inSphere = (random: Random, radius: number, center: Vec3 = [0, 0, 0]): Vec3 =>
  onSphere(random, radius * Math.cbrt(random()), center);

/** On the segment a→b, `t` biased by `bias` (1 = uniform, >1 crowds towards a). */
export const onSegment = (random: Random, a: Vec3, b: Vec3, bias = 1): Vec3 => {
  const t = random() ** bias;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
};

/** Uniform on a triangle. */
export const onTriangle = (random: Random, a: Vec3, b: Vec3, c: Vec3): Vec3 => {
  let u = random();
  let v = random();
  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  return [
    a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v,
    a[1] + (b[1] - a[1]) * u + (c[1] - a[1]) * v,
    a[2] + (b[2] - a[2]) * u + (c[2] - a[2]) * v,
  ];
};

/** On the surface of an axis-aligned box, faces weighted by area. */
export const onBox = (random: Random, center: Vec3, size: Vec3): Vec3 => {
  const [sx, sy, sz] = size;
  const areas = [sy * sz, sx * sz, sx * sy];
  const pick = random() * (areas[0] + areas[1] + areas[2]);
  const axis = pick < areas[0] ? 0 : Number(pick >= areas[0] + areas[1]) + 1;
  const point: Vec3 = [
    between(random, -0.5, 0.5),
    between(random, -0.5, 0.5),
    between(random, -0.5, 0.5),
  ];
  point[axis] = random() < 0.5 ? -0.5 : 0.5;
  return [center[0] + point[0] * sx, center[1] + point[1] * sy, center[2] + point[2] * sz];
};

/** On the side of a cylinder standing on the Y axis from `base` upwards. */
export const onCylinder = (random: Random, base: Vec3, radius: number, height: number): Vec3 => {
  const angle = random() * TAU;
  return [
    base[0] + radius * Math.cos(angle),
    base[1] + random() * height,
    base[2] + radius * Math.sin(angle),
  ];
};

/** On a flat annulus in the XZ plane. */
export const onRing = (random: Random, inner: number, outer: number, y = 0): Vec3 => {
  const angle = random() * TAU;
  const radius = Math.sqrt(between(random, inner * inner, outer * outer));
  return [radius * Math.cos(angle), y, radius * Math.sin(angle)];
};

/** On a circular arc of `radius` in the XZ plane, from `start` to `end` radians. */
export const onArc = (random: Random, radius: number, start: number, end: number): Vec3 => {
  const angle = between(random, start, end);
  return [radius * Math.cos(angle), 0, radius * Math.sin(angle)];
};

/** Rotate about the X axis. */
export const tiltX = ([x, y, z]: Vec3, angle: number): Vec3 => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x, y * cos - z * sin, y * sin + z * cos];
};

/** Rotate about the Z axis. */
export const tiltZ = ([x, y, z]: Vec3, angle: number): Vec3 => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x * cos - y * sin, x * sin + y * cos, z];
};

export const offset = ([x, y, z]: Vec3, [dx, dy, dz]: Vec3): Vec3 => [x + dx, y + dy, z + dz];

/** Small isotropic noise, so sampled surfaces read as particles rather than meshes. */
export const jitter = (random: Random, point: Vec3, amount: number): Vec3 => [
  point[0] + between(random, -amount, amount),
  point[1] + between(random, -amount, amount),
  point[2] + between(random, -amount, amount),
];

/** Shares `count` points between the parts by weight; the last part takes the rounding. */
export const fillCloud = (count: number, parts: readonly Part[], random: Random): Cloud => {
  const positions = new Float32Array(count * 3);
  const tags = new Float32Array(count);
  const total = parts.reduce((sum, part) => sum + part.weight, 0);
  let written = 0;
  parts.forEach((part, index) => {
    const isLast = index === parts.length - 1;
    const share = isLast ? count - written : Math.floor((count * part.weight) / total);
    for (let n = 0; n < share; n += 1) {
      positions.set(part.sample(random), (written + n) * 3);
      tags[written + n] = part.tag ?? 0;
    }
    written += share;
  });
  return { positions, tags };
};

/** A uniformly chosen index below `length`. */
export const pickIndex = (random: Random, length: number): number =>
  Math.min(length - 1, Math.floor(random() * length));

/** Point on a quadratic Bézier a→b bent through control `c`, at `t`. */
export const onQuadratic = (a: Vec3, c: Vec3, b: Vec3, t: number): Vec3 => {
  const u = 1 - t;
  return [
    u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
    u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
    u * u * a[2] + 2 * u * t * c[2] + t * t * b[2],
  ];
};

/** Evenly spread `count` positions from `min` to `max` (one sits in the middle). */
export const spread = (count: number, min: number, max: number): number[] =>
  Array.from({ length: count }, (_, i) =>
    count === 1 ? (min + max) / 2 : min + ((max - min) * i) / (count - 1)
  );

/** A whole-number shape argument kept inside [min, max]. */
export const clampCount = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.round(value)));
