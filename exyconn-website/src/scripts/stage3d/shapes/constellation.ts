import {
  fillCloud,
  inSphere,
  jitter,
  offset,
  onSegment,
  onSphere,
  pickIndex,
  type Cloud,
  type Part,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * A knowledge constellation: `groups[g]` stars clustered around group `g`'s centre (stars
 * of group `g` carry tag `g + 1`), with `links` drawn between stars (tag 0) — e.g. blog
 * posts by category, linked when they share a tag. At most 300 stars.
 */
export interface ConstellationParams {
  /** Star count per group. */
  groups?: readonly number[];
  /** Pairs of star indices, counted across groups in order. */
  links?: readonly (readonly [number, number])[];
}

export const CONSTELLATION_BOUNDS: Vec3 = [2.2, 1.2, 2.2];
export const MAX_STARS = 300;
const RING = 1.4;

interface Star {
  at: Vec3;
  group: number;
}

/** Places every star once, so links and glows agree on where each star is. */
export const placeStars = (random: Random, groups: readonly number[]): Star[] => {
  const stars: Star[] = [];
  groups.forEach((size, group) => {
    const angle = (group / groups.length) * Math.PI * 2;
    const centre: Vec3 = [RING * Math.cos(angle), 0, RING * Math.sin(angle)];
    for (let i = 0; i < size && stars.length < MAX_STARS; i += 1) {
      const [x, y, z] = inSphere(random, 0.6);
      stars.push({ at: offset([x, y * 0.6, z], centre), group });
    }
  });
  return stars;
};

export const sampleConstellation = (
  count: number,
  random: Random,
  params: ConstellationParams = {}
): Cloud => {
  const stars = placeStars(
    random,
    (params.groups ?? []).map((size) => Math.max(0, size))
  );
  if (stars.length === 0) {
    throw new Error("constellation needs at least one star");
  }
  const links = (params.links ?? []).filter(
    ([a, b]) => a !== b && stars[a] !== undefined && stars[b] !== undefined
  );
  const groupCount = Math.max(...stars.map((star) => star.group)) + 1;
  const glows: Part[] = Array.from({ length: groupCount }, (_, group) => {
    const members = stars.filter((star) => star.group === group);
    return {
      weight: members.length,
      tag: group + 1,
      sample: (r: Random) => onSphere(r, 0.05 * r(), members[pickIndex(r, members.length)].at),
    };
  }).filter((part) => part.weight > 0);
  const lines: Part[] = links.map(([a, b]) => ({
    weight: 0.5,
    sample: (r: Random) => jitter(r, onSegment(r, stars[a].at, stars[b].at), 0.006),
  }));
  return fillCloud(count, [...glows, ...lines], random);
};
