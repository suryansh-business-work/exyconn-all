/**
 * The small numeric helpers the home scene runs on every frame. Pure, so the scroll and
 * morph logic built on them can be tested without a browser.
 */
export const clamp = (value: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, value));

export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

/** Hermite ease between two edges, 0 below `edge0` and 1 above `edge1`. */
export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

/**
 * Frame-rate independent exponential approach: the same `lambda` settles at the same speed
 * whether the screen runs at 30 or 120 Hz.
 */
export const damp = (current: number, target: number, lambda: number, dt: number): number =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

/** Seeded PRNG (mulberry32), so every visit samples the same shapes. */
export const createRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Wraps `value` into [min, max), for things that leave one edge and re-enter at the other. */
export const wrap = (value: number, min: number, max: number): number => {
  const span = max - min;
  return ((((value - min) % span) + span) % span) + min;
};
