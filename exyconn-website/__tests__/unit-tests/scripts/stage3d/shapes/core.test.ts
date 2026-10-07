import { describe, expect, it } from "vitest";
import { createRandom } from "../../../../../src/scripts/stage3d/math";
import {
  CORE_RADIUS,
  coreNodes,
  linkNodes,
  linkPositions,
  sampleCore,
  type Link,
} from "../../../../../src/scripts/stage3d/shapes/core";
import type { Vec3 } from "../../../../../src/scripts/stage3d/shapes/sampling";
import { points } from "./helpers";

const NODES: Vec3[] = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 0.5, 0],
  [5, 0, 0],
];

describe("core nodes", () => {
  it("scatters nodes through the orb's volume", () => {
    const nodes = coreNodes(createRandom(1), 40);
    expect(nodes).toHaveLength(40);
    for (const node of nodes) {
      const radius = Math.hypot(...node);
      expect(radius).toBeGreaterThanOrEqual(0.55 - 1e-9);
      expect(radius).toBeLessThanOrEqual(1.5 + 1e-9);
    }
  });

  it("links only close pairs, nearest first, up to the limit", () => {
    expect(linkNodes(NODES, 1.2, 10)).toEqual([
      [NODES[0], NODES[2]],
      [NODES[0], NODES[1]],
      [NODES[1], NODES[2]],
    ]);
    expect(linkNodes(NODES, 1.2, 2)).toEqual([
      [NODES[0], NODES[2]],
      [NODES[0], NODES[1]],
    ]);
    expect(linkNodes(NODES, 0.4, 10)).toEqual([]);
    expect(linkNodes([], 1, 10)).toEqual([]);
  });

  it("flattens links into segment endpoints", () => {
    const links: Link[] = [
      [
        [0, 1, 2],
        [3, 4, 5],
      ],
      [
        [6, 7, 8],
        [9, 10, 11],
      ],
    ];
    expect([...linkPositions(links)]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(linkPositions([])).toHaveLength(0);
  });
});

describe("sampleCore", () => {
  it("fills the orb inside its outer shell with untagged points", () => {
    const random = createRandom(2);
    const nodes = coreNodes(random, 24);
    const links = linkNodes(nodes, 1.1, 80);
    const cloud = sampleCore(1200, random, nodes, links);
    expect(cloud.positions).toHaveLength(3600);
    expect([...cloud.tags].every((tag) => tag === 0)).toBe(true);
    expect(cloud).not.toHaveProperty("order");
    const radii = points(cloud.positions).map((point) => Math.hypot(...point));
    expect(Math.max(...radii)).toBeLessThan(CORE_RADIUS + 0.06);
    // A third of the points form the outer shell.
    expect(radii.filter((radius) => radius > CORE_RADIUS - 0.06).length).toBeGreaterThan(300);
  });
});
