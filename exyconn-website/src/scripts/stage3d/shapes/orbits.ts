import {
  clampCount,
  fillCloud,
  inSphere,
  jitter,
  onArc,
  onSegment,
  onSphere,
  tiltX,
  type Cloud,
  type Part,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * Agentic AI: a small core with `agents` nodes on tilted orbits and packets travelling the
 * links between them. Agent `i`, its link and its packets carry tag `i + 1`.
 */
export interface OrbitsParams {
  agents?: number;
}

export const ORBITS_BOUNDS: Vec3 = [2, 2, 2];
const ORBIT_RADIUS = 1.65;
const TILT = 0.45;
const MAX_AGENTS = 12;

export const agentPosition = (index: number, total: number): Vec3 => {
  const angle = (index / total) * Math.PI * 2;
  const lane = index % 2 === 0 ? TILT : -TILT;
  return tiltX([ORBIT_RADIUS * Math.cos(angle), 0, ORBIT_RADIUS * Math.sin(angle)], lane);
};

const agentParts = (index: number, total: number): Part[] => {
  const at = agentPosition(index, total);
  const tag = index + 1;
  return [
    { weight: 0.5, tag, sample: (r) => onSphere(r, 0.14, at) },
    { weight: 0.5, tag, sample: (r) => jitter(r, onSegment(r, [0, 0, 0], at), 0.02) },
  ];
};

export const sampleOrbits = (count: number, random: Random, params: OrbitsParams = {}): Cloud => {
  const total = clampCount(params.agents ?? 6, 1, MAX_AGENTS);
  return fillCloud(
    count,
    [
      { weight: 1.4, sample: (r) => inSphere(r, 0.45) },
      {
        weight: 0.8,
        sample: (r) => tiltX(onArc(r, ORBIT_RADIUS, 0, Math.PI * 2), r() < 0.5 ? TILT : -TILT),
      },
      ...Array.from({ length: total }, (_, index) => agentParts(index, total)).flat(),
    ],
    random
  );
};
