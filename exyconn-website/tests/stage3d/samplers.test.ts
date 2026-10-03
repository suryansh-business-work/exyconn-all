import { describe, expect, it } from "vitest";
import { createRandom } from "../../src/scripts/stage3d/math";
import { placeStars, sampleConstellation } from "../../src/scripts/stage3d/shapes/constellation";
import {
  CONVERGE_LOSS,
  CONVERGE_SHAPE,
  CONVERGE_STRAY,
  sampleConverge,
} from "../../src/scripts/stage3d/shapes/converge";
import { cubeCentre, MAX_CUBES, sampleCubes } from "../../src/scripts/stage3d/shapes/cubes";
import { figureAt, MAX_FIGURES, sampleFigures } from "../../src/scripts/stage3d/shapes/figures";
import {
  arcPoint,
  fromLatLon,
  GLOBE_RADIUS,
  sampleGlobe,
} from "../../src/scripts/stage3d/shapes/globe";
import { GLYPH_SCALE, sampleGlyph } from "../../src/scripts/stage3d/shapes/glyph";
import { sampleHorizon } from "../../src/scripts/stage3d/shapes/horizon";
import { portAt, sampleHubSpokes } from "../../src/scripts/stage3d/shapes/hub-spokes";
import { clusterCentre, sampleLattice } from "../../src/scripts/stage3d/shapes/lattice";
import { sampleLayers } from "../../src/scripts/stage3d/shapes/layers";
import { agentPosition, sampleOrbits } from "../../src/scripts/stage3d/shapes/orbits";
import { samplePipeline, stationAt } from "../../src/scripts/stage3d/shapes/pipeline";
import { ringRadius, sampleRings } from "../../src/scripts/stage3d/shapes/rings";
import {
  clampCount,
  onQuadratic,
  pickIndex,
  spread,
} from "../../src/scripts/stage3d/shapes/sampling";
import { barHeights, MAX_BARS, sampleTerrain } from "../../src/scripts/stage3d/shapes/terrain";
import {
  sampleTokenStream,
  TOKENS_IN,
  TOKENS_OUT,
  TOKENS_VOLUME,
} from "../../src/scripts/stage3d/shapes/token-stream";
import { points } from "../support/points";

const N = 2000;
const rng = () => createRandom(3);
const tagSet = (tags: Float32Array) => [...new Set(tags)].sort((a, b) => a - b);
const tagged = (positions: Float32Array, tags: Float32Array, tag: number) =>
  points(positions).filter((_, i) => tags[i] === tag);

describe("sampling helpers", () => {
  it("picks indices, bends curves, spreads and clamps counts", () => {
    expect(pickIndex(() => 0.9999999, 3)).toBe(2);
    expect(pickIndex(() => 1, 3)).toBe(2);
    expect(onQuadratic([0, 0, 0], [1, 2, 0], [2, 0, 0], 0.5)).toEqual([1, 1, 0]);
    expect(spread(1, -2, 2)).toEqual([0]);
    expect(spread(3, -2, 2)).toEqual([-2, 0, 2]);
    expect(clampCount(20, 1, 12)).toBe(12);
    expect(clampCount(0, 1, 12)).toBe(1);
    expect(clampCount(4.4, 1, 12)).toBe(4);
  });
});

describe("globe", () => {
  it("places lat/lon on the sphere and lifts arcs off it", () => {
    expect(fromLatLon({ lat: 90, lon: 0 }, 1)[1]).toBeCloseTo(1);
    const a = fromLatLon({ lat: 0, lon: 0 }, GLOBE_RADIUS);
    const b = fromLatLon({ lat: 0, lon: 90 }, GLOBE_RADIUS);
    expect(Math.hypot(...arcPoint(a, b, 0.5, 0.3))).toBeCloseTo(GLOBE_RADIUS + 0.3);
    expect(arcPoint(a, b, 0, 0.3)).toEqual(a.map((v) => expect.closeTo(v, 6)));
    expect(arcPoint(a, a, 0.5, 0.3)[2]).toBeCloseTo(GLOBE_RADIUS + 0.3);
  });

  it("is a bare globe without arcs, and caps the arcs it draws", () => {
    expect(tagSet(sampleGlobe(N, rng()).tags)).toEqual([0]);
    const arc = { from: { lat: 10, lon: 10 }, to: { lat: -20, lon: 120 } };
    expect(tagSet(sampleGlobe(N, rng(), { arcs: [arc, arc, arc], maxArcs: 2 }).tags)).toEqual([
      0, 1, 2,
    ]);
  });
});

describe("structural shapes", () => {
  it("tags each horizon arc", () => {
    expect(tagSet(sampleHorizon(N, rng(), { horizons: 4 }).tags)).toEqual([0, 1, 2, 3, 4]);
    expect(tagSet(sampleHorizon(N, rng()).tags)).toEqual([0, 1, 2, 3]);
    expect(tagSet(sampleHorizon(N, rng(), { horizons: 0 }).tags)).toEqual([0, 1]);
  });

  it("stacks lattice clusters around a ring, or one in the middle", () => {
    expect(clusterCentre(0, 1)).toEqual([0, 0, 0]);
    expect(clusterCentre(0, 3)[2]).toBeCloseTo(1.35);
    expect(tagSet(sampleLattice(N, rng()).tags)).toEqual([1, 2, 3]);
    expect(tagSet(sampleLattice(N, rng(), { clusters: 1 }).tags)).toEqual([1]);
  });

  it("orbits agents around a core and links them", () => {
    expect(Math.hypot(...agentPosition(1, 6))).toBeCloseTo(1.65);
    expect(tagSet(sampleOrbits(N, rng(), { agents: 3 }).tags)).toEqual([0, 1, 2, 3]);
    expect(tagSet(sampleOrbits(N, rng()).tags)).toHaveLength(7);
  });

  it("streams tokens in, through a volume and out in order", () => {
    const cloud = sampleTokenStream(N, rng(), { tokens: 6 });
    expect(tagSet(cloud.tags)).toEqual([TOKENS_IN, TOKENS_VOLUME, TOKENS_OUT]);
    expect(tagged(cloud.positions, cloud.tags, TOKENS_IN).every(([x]) => x < -0.8)).toBe(true);
    const out = tagged(cloud.positions, cloud.tags, TOKENS_OUT);
    expect(out.every(([x, y, z]) => x > 0.9 && y === 0 && z === 0)).toBe(true);
    expect(tagSet(sampleTokenStream(N, rng()).tags)).toHaveLength(3);
  });

  it("stacks layers with links between neighbours", () => {
    expect(tagSet(sampleLayers(N, rng()).tags)).toEqual([0, 1, 2, 3, 4, 5]);
    const single = sampleLayers(N, rng(), { layers: 1 });
    expect(tagSet(single.tags)).toEqual([0, 1]);
    expect(points(single.positions).every(([, y]) => Math.abs(y) < 0.02)).toBe(true);
  });

  it("shows the learned shape, the loss curve and the strays", () => {
    expect(tagSet(sampleConverge(N, rng()).tags)).toEqual([
      CONVERGE_SHAPE,
      CONVERGE_LOSS,
      CONVERGE_STRAY,
    ]);
  });

  it("spokes out to one satellite per port", () => {
    expect(portAt(0, 4, 1)[1]).toBeCloseTo(1);
    expect(tagSet(sampleHubSpokes(N, rng(), { ports: 8 }).tags)).toHaveLength(9);
    expect(tagSet(sampleHubSpokes(N, rng()).tags)).toHaveLength(7);
  });

  it("flows through stations and branches once when asked", () => {
    expect(stationAt(0)).toEqual([0, 0, 0]);
    const straight = samplePipeline(N, rng());
    const branched = samplePipeline(N, rng(), { stations: 4, branchAt: 1 });
    expect(tagSet(straight.tags)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(tagSet(branched.tags)).toEqual([0, 1, 2, 3, 4]);
    const spanY = (positions: Float32Array) =>
      Math.max(...points(positions).map(([, y]) => Math.abs(y)));
    expect(spanY(branched.positions)).toBeGreaterThan(spanY(straight.positions));
  });

  it("lays cubes in a grid, at most twelve", () => {
    expect(cubeCentre(0, 1)).toEqual([0, 0, 0]);
    expect(cubeCentre(3, 4)).toEqual([0.55, -0.55, 0].map((v) => expect.closeTo(v, 6)));
    expect(tagSet(sampleCubes(N, rng(), { cubes: 40 }).tags)).toHaveLength(MAX_CUBES);
    expect(tagSet(sampleCubes(N, rng()).tags)).toHaveLength(6);
  });

  it("networks figures over a sphere, at most forty", () => {
    expect(figureAt(0, 1)).toEqual([1.55, 0, 0]);
    expect(tagSet(sampleFigures(N, rng(), { figures: 99 }).tags)).toHaveLength(MAX_FIGURES + 1);
    expect(tagSet(sampleFigures(N, rng(), { figures: 1 }).tags)).toEqual([1]);
    expect(tagSet(sampleFigures(N, rng()).tags)).toHaveLength(13);
  });

  it("spaces beacon rings evenly, innermost first", () => {
    expect(ringRadius(0, 1)).toBeCloseTo(1.275);
    expect(ringRadius(0, 3)).toBeCloseTo(0.55);
    expect(ringRadius(2, 3)).toBeCloseTo(2);
    expect(tagSet(sampleRings(N, rng(), { rings: 2 }).tags)).toEqual([0, 1, 2]);
    expect(tagSet(sampleRings(N, rng()).tags)).toHaveLength(5);
  });
});

describe("data-driven shapes", () => {
  it("draws glyph strokes in the unit square, clamping and skipping degenerate paths", () => {
    const cloud = sampleGlyph(N, rng(), {
      paths: [
        [
          [-2, 0],
          [2, 0],
        ],
        [[0, 0]],
        [
          [0.5, 0.5],
          [0.5, 0.5],
        ],
      ],
      depth: 9,
    });
    expect(tagSet(cloud.tags)).toEqual([1, 2]);
    expect(points(cloud.positions).every(([x]) => Math.abs(x) <= GLYPH_SCALE + 0.02)).toBe(true);
    expect(() => sampleGlyph(N, rng())).toThrow(/glyph/);
    expect(
      tagSet(
        sampleGlyph(N, rng(), {
          paths: [
            [
              [0, 0],
              [1, 1],
            ],
          ],
          depth: -1,
        }).tags
      )
    ).toEqual([1]);
  });

  it("scales terrain bars to the largest value", () => {
    expect(barHeights([0, 5, 10])).toEqual([0.2, 1.4, 2.6].map((v) => expect.closeTo(v, 6)));
    expect(barHeights([-3, 0])).toEqual([0.2, 0.2]);
    expect(barHeights(Array.from({ length: 30 }, () => 1))).toHaveLength(MAX_BARS);
    expect(tagSet(sampleTerrain(N, rng(), { values: [1, 2] }).tags)).toEqual([0, 1, 2]);
    expect(() => sampleTerrain(N, rng())).toThrow(/terrain/);
  });

  it("clusters stars by group and links valid pairs only", () => {
    expect(placeStars(rng(), [400])).toHaveLength(300);
    const cloud = sampleConstellation(N, rng(), {
      groups: [2, 0, -4, 3],
      links: [
        [0, 1],
        [1, 1],
        [0, 99],
      ],
    });
    expect(tagSet(cloud.tags)).toEqual([0, 1, 4]);
    expect(tagSet(sampleConstellation(N, rng(), { groups: [3] }).tags)).toEqual([1]);
    expect(() => sampleConstellation(N, rng(), { groups: [0] })).toThrow(/constellation/);
    expect(() => sampleConstellation(N, rng())).toThrow(/constellation/);
  });
});
