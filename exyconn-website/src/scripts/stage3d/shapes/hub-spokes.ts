import {
  clampCount,
  fillCloud,
  jitter,
  onBox,
  onRing,
  onSegment,
  tiltX,
  type Cloud,
  type Part,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * MCP — "USB-C for AI": a hub ring with `ports` sockets (tag 0) and a spoke out to a
 * satellite (database, files, API, calendar…) per port. Spoke and satellite `i` carry tag
 * `i + 1`.
 */
export interface HubSpokesParams {
  ports?: number;
}

export const HUB_SPOKES_BOUNDS: Vec3 = [2.2, 2.2, 0.6];
const HUB_RADIUS = 0.55;
const SATELLITE_RADIUS = 1.85;
const MAX_PORTS = 12;

/** Port `index` of `total` around the hub, at `radius`, in the XY plane. */
export const portAt = (index: number, total: number, radius: number): Vec3 => {
  const angle = (index / total) * Math.PI * 2 + Math.PI / 2;
  return [radius * Math.cos(angle), radius * Math.sin(angle), 0];
};

const spokeParts = (index: number, total: number): Part[] => {
  const port = portAt(index, total, HUB_RADIUS);
  const satellite = portAt(index, total, SATELLITE_RADIUS);
  const tag = index + 1;
  return [
    { weight: 0.4, tag, sample: (r) => jitter(r, onSegment(r, port, satellite), 0.015) },
    { weight: 0.6, tag, sample: (r) => onBox(r, satellite, [0.3, 0.3, 0.3]) },
  ];
};

export const sampleHubSpokes = (
  count: number,
  random: Random,
  params: HubSpokesParams = {}
): Cloud => {
  const total = clampCount(params.ports ?? 6, 1, MAX_PORTS);
  return fillCloud(
    count,
    [
      {
        weight: 0.25 * total,
        sample: (r) => tiltX(onRing(r, HUB_RADIUS - 0.1, HUB_RADIUS), Math.PI / 2),
      },
      ...Array.from({ length: total }, (_, index) => spokeParts(index, total)).flat(),
    ],
    random
  );
};
