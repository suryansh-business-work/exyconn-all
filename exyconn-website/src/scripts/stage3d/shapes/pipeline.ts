import {
  clampCount,
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
 * Workflows: points flowing along a line through `stations` stops (station `i` carries tag
 * `i + 1`). Between station `branchAt` and the next the flow splits into two lanes and
 * rejoins; the flow itself is tag 0.
 */
export interface PipelineParams {
  stations?: number;
  /** Station index after which the flow branches; out of range means no branch. */
  branchAt?: number;
}

export const PIPELINE_BOUNDS: Vec3 = [2.4, 1.4, 0.6];
const MAX_STATIONS = 8;

export const stationAt = (x: number): Vec3 => [x, 0.35 * Math.sin(x * 1.3), 0];

const flow = (random: Random, from: Vec3, to: Vec3, bend: number): Vec3 => {
  const control: Vec3 = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + bend, 0];
  return jitter(random, onQuadratic(from, control, to, random()), 0.02);
};

export const samplePipeline = (
  count: number,
  random: Random,
  params: PipelineParams = {}
): Cloud => {
  const total = clampCount(params.stations ?? 5, 2, MAX_STATIONS);
  const branchAt = params.branchAt ?? -1;
  const stations = spread(total, -2.1, 2.1).map(stationAt);
  const legs: Part[] = stations.slice(1).flatMap((to, i) => {
    const from = stations[i];
    if (i === branchAt) {
      return [
        { weight: 0.5, sample: (r: Random) => flow(r, from, to, 0.9) },
        { weight: 0.5, sample: (r: Random) => flow(r, from, to, -0.9) },
      ];
    }
    return [{ weight: 1, sample: (r: Random) => flow(r, from, to, 0) }];
  });
  return fillCloud(
    count,
    [
      ...stations.map((at, index) => ({
        weight: 0.6,
        tag: index + 1,
        sample: (r: Random) => onSphere(r, 0.16, at),
      })),
      ...legs,
    ],
    random
  );
};
