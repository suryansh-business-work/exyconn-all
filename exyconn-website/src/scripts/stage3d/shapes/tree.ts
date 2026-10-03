import {
  fillCloud,
  jitter,
  onQuadratic,
  onSphere,
  spread,
  type Cloud,
  type Part,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * A node graph read top-down — a site map: a root node, one node per section, and that
 * section's pages fanned beneath it (`branches[i]` pages). Section `i`, its pages and its
 * links carry tag `i + 1`; the root is tag 0. At most 12 sections and 24 pages each.
 */
export interface TreeParams {
  branches?: readonly number[];
}

export const TREE_BOUNDS: Vec3 = [2.4, 1.8, 0.8];
const MAX_BRANCHES = 12;
const MAX_LEAVES = 24;
const ROOT: Vec3 = [0, 1.45, 0];
const SECTION_Y = 0.35;
const LEAF_Y = -1.3;

const link = (random: Random, from: Vec3, to: Vec3): Vec3 =>
  jitter(random, onQuadratic(from, [to[0], from[1], 0], to, random()), 0.01);

/** Leaf `index` of `total` under a section at `x`, fanned in a small arc. */
export const leafAt = (x: number, index: number, total: number, width: number): Vec3 => {
  const [offset] = spread(total, -width / 2, width / 2).slice(index, index + 1);
  return [
    x + offset,
    LEAF_Y - 0.25 * Math.abs(offset / Math.max(width, 0.01)),
    0.3 * Math.sin(index),
  ];
};

const sectionParts = (leaves: number, x: number, width: number, tag: number): Part[] => {
  const node: Vec3 = [x, SECTION_Y, 0];
  const pages = Array.from({ length: leaves }, (_, i) => leafAt(x, i, leaves, width));
  return [
    { weight: 0.4, tag, sample: (r) => onSphere(r, 0.1, node) },
    { weight: 0.4, tag, sample: (r) => link(r, ROOT, node) },
    ...pages.flatMap((page) => [
      { weight: 0.12, tag, sample: (r: Random) => onSphere(r, 0.045, page) },
      { weight: 0.12, tag, sample: (r: Random) => link(r, node, page) },
    ]),
  ];
};

export const sampleTree = (count: number, random: Random, params: TreeParams = {}): Cloud => {
  const branches = (params.branches ?? [3, 3, 3])
    .slice(0, MAX_BRANCHES)
    .map((leaves) => Math.min(MAX_LEAVES, Math.max(0, Math.round(leaves))));
  if (branches.length === 0) {
    throw new Error("tree needs at least one branch");
  }
  const xs = spread(branches.length, -1.9, 1.9);
  const width = Math.min(0.8, 3.6 / branches.length);
  return fillCloud(
    count,
    [
      { weight: 0.4, sample: (r) => onSphere(r, 0.16, ROOT) },
      ...branches.flatMap((leaves, i) => sectionParts(leaves, xs[i], width, i + 1)),
    ],
    random
  );
};
