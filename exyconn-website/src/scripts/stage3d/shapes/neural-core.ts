import { arcPoints, createLines, type LineBuilder } from "./lines";
import {
  clampCount,
  fillCloud,
  inSphere,
  jitter,
  pickIndex,
  tiltX,
  tiltZ,
  type Cloud,
  type Part,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * AI services: a neural core with the work it does in orbit. A glowing nucleus inside a
 * shell of neurons wired by synapses; two tilted orbits round it; and on them one agent
 * module per category — a faceted crystal with a halo — each streaming data back into the
 * core along a curved link that carries pulses. Built in that order: nucleus, neurons and
 * synapses, the orbits sweeping round, the modules, then their links lighting up.
 *
 * The core and the orbits are tag 0; module `i`, its halo and its link are tag `i + 1`, so a
 * category card lights its own module.
 */
export interface NeuralCoreParams {
  modules?: number;
}

export const NEURAL_CORE_BOUNDS: Vec3 = [2.45, 1.75, 2.45];

const MAX_MODULES = 10;
const NUCLEUS_RADIUS = 0.26;
const SHELL_RADIUS = 0.68;
const NEURONS = 96;
/** Neurons closer than this are wired together. */
const SYNAPSE_REACH = 0.36;
const ORBITS: readonly { radius: number; tilt: number; roll: number }[] = [
  { radius: 1.5, tilt: 0.42, roll: 0.18 },
  { radius: 2.05, tilt: -0.3, roll: -0.12 },
];
const MODULE_RADIUS = 0.17;
const HALO_RADIUS = 0.3;
const TAU = Math.PI * 2;

const distance = (a: Vec3, b: Vec3): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** A point on orbit `index` at `angle`. */
const onOrbit = (index: number, angle: number): Vec3 => {
  const { radius, tilt, roll } = ORBITS[index];
  return tiltZ(tiltX([radius * Math.cos(angle), 0, radius * Math.sin(angle)], tilt), roll);
};

/** Neuron positions spread evenly over the shell (a Fibonacci sphere), so it reads as a mesh. */
const neuronsOnShell = (): Vec3[] => {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: NEURONS }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / NEURONS;
    const ring = Math.sqrt(1 - y * y);
    const angle = golden * i;
    return [
      SHELL_RADIUS * ring * Math.cos(angle),
      SHELL_RADIUS * y,
      SHELL_RADIUS * ring * Math.sin(angle),
    ];
  });
};

const NEURON_POSITIONS = neuronsOnShell();

/** Every pair of neighbouring neurons, once. */
const SYNAPSES: readonly [Vec3, Vec3][] = NEURON_POSITIONS.flatMap((a, i) =>
  NEURON_POSITIONS.slice(i + 1)
    .filter((b) => distance(a, b) < SYNAPSE_REACH)
    .map((b): [Vec3, Vec3] => [a, b])
);

/** Where module `index` of `total` sits: alternate orbits, spread evenly round each. */
const modulePosition = (index: number, total: number): Vec3 => {
  const orbit = index % ORBITS.length;
  const onThisOrbit = Math.ceil((total - orbit) / ORBITS.length);
  const slot = Math.floor(index / ORBITS.length);
  const angle = (slot / Math.max(onThisOrbit, 1)) * TAU + orbit * 0.6 + 0.3;
  return onOrbit(orbit, angle);
};

/** The six tips of a module's crystal (an octahedron, stretched a little upwards). */
const crystalTips = (centre: Vec3): Vec3[] => {
  const r = MODULE_RADIUS;
  const [x, y, z] = centre;
  return [
    [x + r, y, z],
    [x - r, y, z],
    [x, y + r * 1.35, z],
    [x, y - r * 1.35, z],
    [x, y, z + r],
    [x, y, z - r],
  ];
};

/** The eight faces of the crystal, as tip indices. */
const CRYSTAL_FACES: readonly [number, number, number][] = [
  [0, 2, 4],
  [4, 2, 1],
  [1, 2, 5],
  [5, 2, 0],
  [0, 3, 4],
  [4, 3, 1],
  [1, 3, 5],
  [5, 3, 0],
];

/** A point on the crystal's faces, crowded towards its edges so the facets catch the light. */
const onCrystal = (random: Random, centre: Vec3): Vec3 => {
  const tips = crystalTips(centre);
  const [a, b, c] = CRYSTAL_FACES[pickIndex(random, CRYSTAL_FACES.length)].map((i) => tips[i]);
  let u = random() ** 0.6;
  let v = random() ** 0.6;
  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  return [
    a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v,
    a[1] + (b[1] - a[1]) * u + (c[1] - a[1]) * v,
    a[2] + (b[2] - a[2]) * u + (c[2] - a[2]) * v,
  ];
};

/** A point on the halo ring that circles a module, facing the camera. */
const onHalo = (random: Random, centre: Vec3): Vec3 => {
  const angle = random() * TAU;
  return jitter(
    random,
    [
      centre[0] + HALO_RADIUS * Math.cos(angle),
      centre[1] + HALO_RADIUS * Math.sin(angle),
      centre[2],
    ],
    0.008
  );
};

/** The link from a module back into the core, bowed upwards so it reads as a stream. */
const linkPoints = (centre: Vec3): Vec3[] => {
  const length = Math.hypot(...centre);
  const entry: Vec3 = centre.map((v) => (v / length) * SHELL_RADIUS * 1.02) as Vec3;
  return arcPoints(centre, entry, 0.35, 20);
};

/** The core: a dense nucleus, the neurons as bright knots, synapses as faint threads. */
const coreParts = (random: Random): Part[] => [
  {
    weight: 1.1,
    sample: (r) => inSphere(r, NUCLEUS_RADIUS),
    order: (p) => 0.08 * (Math.hypot(...p) / NUCLEUS_RADIUS),
  },
  {
    weight: 1.6,
    sample: (r) => jitter(r, NEURON_POSITIONS[pickIndex(r, NEURONS)], 0.035),
    order: (p) => 0.08 + 0.14 * ((p[1] + SHELL_RADIUS) / (2 * SHELL_RADIUS)),
  },
  {
    weight: 1.2,
    sample: (r) => {
      const [a, b] = SYNAPSES[pickIndex(r, SYNAPSES.length)];
      const t = r();
      return jitter(
        r,
        [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
        0.006
      );
    },
    order: () => 0.16 + 0.1 * random(),
  },
];

/** The two orbits, drawn round in the order of their angle. */
const orbitParts = (): Part[] =>
  ORBITS.map((_, index) => ({
    weight: 0.9,
    sample: (r: Random) => jitter(r, onOrbit(index, r() * TAU), 0.012),
    order: (p: Vec3) => 0.26 + index * 0.04 + 0.12 * ((Math.atan2(p[2], p[0]) + Math.PI) / TAU),
  }));

/** Module `index`: its crystal, its halo and its link, all tag `index + 1`. */
const moduleParts = (index: number, total: number): Part[] => {
  const centre = modulePosition(index, total);
  const link = linkPoints(centre);
  const reach = distance(centre, link.at(-1) as Vec3);
  const tag = index + 1;
  const start = 0.44 + (index / total) * 0.18;
  return [
    { weight: 0.75, tag, sample: (r) => onCrystal(r, centre), order: () => start },
    { weight: 0.35, tag, sample: (r) => onHalo(r, centre), order: () => start + 0.04 },
    {
      weight: 0.4,
      tag,
      sample: (r) => jitter(r, link[pickIndex(r, link.length)], 0.01),
      // Drawn from the module inwards, as the pulses travel.
      order: (p) => start + 0.2 + 0.1 * Math.min(1, distance(p, centre) / reach),
    },
  ];
};

const drawLines = (lines: LineBuilder, total: number) => {
  SYNAPSES.forEach(([a, b], i) => lines.segment(a, b, 0.16 + (0.1 * i) / SYNAPSES.length));
  ORBITS.forEach((_, index) => {
    const ring = Array.from({ length: 97 }, (__, i) => onOrbit(index, (i / 96) * TAU));
    lines.path(ring, 0.26 + index * 0.04, 0.4 + index * 0.04);
  });
  for (let index = 0; index < total; index += 1) {
    const centre = modulePosition(index, total);
    const start = 0.44 + (index / total) * 0.18;
    const tips = crystalTips(centre);
    CRYSTAL_FACES.forEach(([a, b, c]) => {
      lines.segment(tips[a], tips[b], start);
      lines.segment(tips[b], tips[c], start);
    });
    // Pulses run from the module into the core: the agents feed what they learn back in.
    lines.path(linkPoints(centre), start + 0.2, start + 0.3, true);
  }
};

export const sampleNeuralCore = (
  count: number,
  random: Random,
  params: NeuralCoreParams = {}
): Cloud => {
  const total = clampCount(params.modules ?? 6, 1, MAX_MODULES);
  const modules = Array.from({ length: total }, (_, index) => moduleParts(index, total)).flat();
  const cloud = fillCloud(count, [...coreParts(random), ...orbitParts(), ...modules], random);
  const lines = createLines();
  drawLines(lines, total);
  return { ...cloud, lines: lines.build() };
};
