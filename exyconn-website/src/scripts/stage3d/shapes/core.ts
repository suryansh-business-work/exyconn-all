import {
  fillCloud,
  inSphere,
  jitter,
  offset,
  onSegment,
  onSphere,
  type Cloud,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * The AI core: a glowing neural orb. Two shells, a dense nucleus, and neurons — clusters
 * around nodes scattered through the volume — joined by axons. The same node links are
 * drawn as filaments on larger screens.
 */
export const CORE_RADIUS = 1.6;
export type Link = readonly [Vec3, Vec3];

export const coreNodes = (random: Random, count: number): Vec3[] =>
  Array.from({ length: count }, () => onSphere(random, 0.55 + random() * 0.95));

const distance = (a: Vec3, b: Vec3): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Every node pair closer than `maxLength`, nearest pairs first, at most `limit` of them. */
export const linkNodes = (nodes: readonly Vec3[], maxLength: number, limit: number): Link[] => {
  const links: { link: Link; length: number }[] = [];
  nodes.forEach((a, i) => {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const length = distance(a, nodes[j]);
      if (length < maxLength) {
        links.push({ link: [a, nodes[j]], length });
      }
    }
  });
  return links
    .sort((x, y) => x.length - y.length)
    .slice(0, limit)
    .map(({ link }) => link);
};

/** Flat segment endpoints for a LineSegments geometry. */
export const linkPositions = (links: readonly Link[]): Float32Array =>
  new Float32Array(links.flatMap(([a, b]) => [...a, ...b]));

const pick = <T>(random: Random, items: readonly T[]): T =>
  items[Math.floor(random() * items.length)];

export const sampleCore = (
  count: number,
  random: Random,
  nodes: readonly Vec3[],
  links: readonly Link[]
): Cloud =>
  fillCloud(
    count,
    [
      { weight: 0.34, sample: (r) => jitter(r, onSphere(r, CORE_RADIUS), 0.03) },
      { weight: 0.14, sample: (r) => jitter(r, onSphere(r, 1.05), 0.04) },
      { weight: 0.12, sample: (r) => inSphere(r, 0.42) },
      { weight: 0.18, sample: (r) => offset(inSphere(r, 0.11), pick(r, nodes)) },
      {
        weight: 0.22,
        sample: (r) => {
          const [a, b] = pick(r, links);
          return jitter(r, onSegment(r, a, b), 0.012);
        },
      },
    ],
    random
  );
