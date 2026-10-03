import { createRandom } from "../../stage3d/math";
import { sampleJet } from "../../stage3d/shapes/aviation";
import { coreNodes, linkNodes, linkPositions, sampleCore } from "../../stage3d/shapes/core";
import { sampleRobot } from "../../stage3d/shapes/robotics";
import { sampleSpace } from "../../stage3d/shapes/space";

/**
 * Every target the protagonist morphs between, sampled once for the tier's point budget.
 * The same seed gives the same shapes on every visit.
 */
export interface Targets {
  count: number;
  core: Float32Array;
  jet: Float32Array;
  robot: Float32Array;
  planet: Float32Array;
  /** Per point: [jet trail, robot joint, planet spin, random]. */
  anim: Float32Array;
  /** Filament segment endpoints, empty when the tier draws none. */
  filaments: Float32Array;
}

const SEED = 20261003;
const NODE_COUNT = 48;
const AXON_LINKS = 320;
const LINK_LENGTH = 1.1;

export const buildTargets = (count: number, filaments: number): Targets => {
  const random = createRandom(SEED);
  const nodes = coreNodes(random, NODE_COUNT);
  const axons = linkNodes(nodes, LINK_LENGTH, AXON_LINKS);
  const core = sampleCore(count, random, nodes, axons);
  const jet = sampleJet(count, random);
  const robot = sampleRobot(count, random);
  const planet = sampleSpace(count, random);
  const anim = new Float32Array(count * 4);
  for (let i = 0; i < count; i += 1) {
    anim.set([jet.tags[i], robot.tags[i], planet.tags[i], random()], i * 4);
  }
  return {
    count,
    core: core.positions,
    jet: jet.positions,
    robot: robot.positions,
    planet: planet.positions,
    anim,
    filaments: linkPositions(axons.slice(0, filaments)),
  };
};
