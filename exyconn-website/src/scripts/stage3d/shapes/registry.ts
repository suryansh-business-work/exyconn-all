import { sampleJet } from "./aviation";
import { sampleCity, CITY_BOUNDS } from "./city";
import { sampleCloudStack, CLOUD_STACK_BOUNDS } from "./cloud-stack";
import { sampleDataflow, DATAFLOW_BOUNDS } from "./dataflow";
import { sampleDevices, DEVICES_BOUNDS } from "./devices";
import { sampleIntegration, INTEGRATION_BOUNDS } from "./integration";
import { sampleModernize, MODERNIZE_BOUNDS } from "./modernize";
import { sampleOps, OPS_BOUNDS } from "./ops";
import { sampleRoadmap, ROADMAP_BOUNDS } from "./roadmap";
import {
  sampleConstellation,
  CONSTELLATION_BOUNDS,
  type ConstellationParams,
} from "./constellation";
import { sampleConverge, CONVERGE_BOUNDS, type ConvergeParams } from "./converge";
import { coreNodes, linkNodes, sampleCore } from "./core";
import { sampleCubes, CUBES_BOUNDS, type CubesParams } from "./cubes";
import { sampleDocuments, DOCUMENTS_BOUNDS, type DocumentsParams } from "./documents";
import { sampleFigures, FIGURES_BOUNDS, type FiguresParams } from "./figures";
import { sampleGlobe, GLOBE_BOUNDS, type GlobeParams } from "./globe";
import { sampleGlyph, GLYPH_BOUNDS, type GlyphParams } from "./glyph";
import { sampleHorizon, HORIZON_BOUNDS, type HorizonParams } from "./horizon";
import { sampleHubSpokes, HUB_SPOKES_BOUNDS, type HubSpokesParams } from "./hub-spokes";
import { sampleLattice, LATTICE_BOUNDS, type LatticeParams } from "./lattice";
import { sampleLayers, LAYERS_BOUNDS, type LayersParams } from "./layers";
import { sampleOrbits, ORBITS_BOUNDS, type OrbitsParams } from "./orbits";
import { samplePipeline, PIPELINE_BOUNDS, type PipelineParams } from "./pipeline";
import { sampleRings, RINGS_BOUNDS, type RingsParams } from "./rings";
import { sampleRobot } from "./robotics";
import { sampleShield, SHIELD_BOUNDS, type ShieldParams } from "./shield";
import type { Cloud, Random, Vec3 } from "./sampling";
import { sampleSpace } from "./space";
import { sampleTerrain, TERRAIN_BOUNDS, type TerrainParams } from "./terrain";
import { sampleTokenStream, TOKEN_STREAM_BOUNDS, type TokenStreamParams } from "./token-stream";
import { sampleTree, TREE_BOUNDS, type TreeParams } from "./tree";

/**
 * Every shape a stage can show, keyed by id. A page names the ids it needs and passes the
 * data-driven ones their numbers; only those are sampled. Every sampler is pure and seeded
 * and keeps its points inside `bounds` (half extents about the origin).
 */
export interface ShapeParamsMap {
  core: Record<string, never>;
  jet: Record<string, never>;
  robot: Record<string, never>;
  planet: Record<string, never>;
  globe: GlobeParams;
  horizon: HorizonParams;
  lattice: LatticeParams;
  glyph: GlyphParams;
  orbits: OrbitsParams;
  tokenStream: TokenStreamParams;
  layers: LayersParams;
  converge: ConvergeParams;
  hubSpokes: HubSpokesParams;
  pipeline: PipelineParams;
  cubes: CubesParams;
  terrain: TerrainParams;
  constellation: ConstellationParams;
  figures: FiguresParams;
  rings: RingsParams;
  shield: ShieldParams;
  documents: DocumentsParams;
  tree: TreeParams;
  city: Record<string, never>;
  dataflow: Record<string, never>;
  devices: Record<string, never>;
  cloudStack: Record<string, never>;
  integration: Record<string, never>;
  ops: Record<string, never>;
  roadmap: Record<string, never>;
  modernize: Record<string, never>;
}

export type ShapeId = keyof ShapeParamsMap;

/**
 * How a shape idles: volumes `spin` about Y; flat, camera-facing layouts `sway` a little
 * either side, so they never turn edge-on.
 */
export type ShapeMotion = "spin" | "sway";

export interface ShapeDefinition<P> {
  bounds: Vec3;
  motion: ShapeMotion;
  sample: (count: number, random: Random, params?: P) => Cloud;
  /**
   * How far the stage looks down on the shape, radians. Built scenes with depth — a city, a
   * server room — read as places from a little above; flat diagrams stay face on (0).
   */
  pitch?: number;
}

type Registry = { readonly [K in ShapeId]: ShapeDefinition<ShapeParamsMap[K]> };

const sampleHomeCore = (count: number, random: Random): Cloud => {
  const nodes = coreNodes(random, 48);
  return sampleCore(count, random, nodes, linkNodes(nodes, 1.1, 320));
};

export const SHAPES: Registry = {
  core: { bounds: [1.75, 1.75, 1.75], motion: "spin", sample: sampleHomeCore },
  jet: { bounds: [5.5, 4.2, 4.2], motion: "spin", sample: sampleJet },
  robot: { bounds: [3.1, 2, 1.1], motion: "spin", sample: sampleRobot },
  planet: { bounds: [4.2, 1.5, 4.2], motion: "spin", sample: sampleSpace },
  globe: { bounds: GLOBE_BOUNDS, motion: "spin", sample: sampleGlobe },
  horizon: { bounds: HORIZON_BOUNDS, motion: "sway", sample: sampleHorizon },
  lattice: { bounds: LATTICE_BOUNDS, motion: "spin", sample: sampleLattice },
  glyph: { bounds: GLYPH_BOUNDS, motion: "sway", sample: sampleGlyph },
  orbits: { bounds: ORBITS_BOUNDS, motion: "spin", sample: sampleOrbits },
  tokenStream: { bounds: TOKEN_STREAM_BOUNDS, motion: "sway", sample: sampleTokenStream },
  layers: { bounds: LAYERS_BOUNDS, motion: "spin", sample: sampleLayers },
  converge: { bounds: CONVERGE_BOUNDS, motion: "sway", sample: sampleConverge },
  hubSpokes: { bounds: HUB_SPOKES_BOUNDS, motion: "sway", sample: sampleHubSpokes },
  pipeline: { bounds: PIPELINE_BOUNDS, motion: "sway", sample: samplePipeline },
  cubes: { bounds: CUBES_BOUNDS, motion: "sway", sample: sampleCubes },
  terrain: { bounds: TERRAIN_BOUNDS, motion: "sway", sample: sampleTerrain },
  constellation: { bounds: CONSTELLATION_BOUNDS, motion: "spin", sample: sampleConstellation },
  figures: { bounds: FIGURES_BOUNDS, motion: "spin", sample: sampleFigures },
  rings: { bounds: RINGS_BOUNDS, motion: "sway", sample: sampleRings },
  shield: { bounds: SHIELD_BOUNDS, motion: "sway", sample: sampleShield },
  documents: { bounds: DOCUMENTS_BOUNDS, motion: "sway", sample: sampleDocuments },
  tree: { bounds: TREE_BOUNDS, motion: "sway", sample: sampleTree },
  city: { bounds: CITY_BOUNDS, motion: "spin", sample: sampleCity, pitch: 0.34 },
  dataflow: { bounds: DATAFLOW_BOUNDS, motion: "sway", sample: sampleDataflow, pitch: 0.16 },
  devices: { bounds: DEVICES_BOUNDS, motion: "sway", sample: sampleDevices, pitch: 0.06 },
  cloudStack: { bounds: CLOUD_STACK_BOUNDS, motion: "sway", sample: sampleCloudStack, pitch: 0.12 },
  integration: {
    bounds: INTEGRATION_BOUNDS,
    motion: "sway",
    sample: sampleIntegration,
    pitch: 0.18,
  },
  ops: { bounds: OPS_BOUNDS, motion: "sway", sample: sampleOps, pitch: 0.04 },
  roadmap: { bounds: ROADMAP_BOUNDS, motion: "sway", sample: sampleRoadmap, pitch: 0.22 },
  modernize: { bounds: MODERNIZE_BOUNDS, motion: "sway", sample: sampleModernize, pitch: 0.14 },
};

export const SHAPE_IDS = Object.keys(SHAPES) as ShapeId[];

const IDS: ReadonlySet<string> = new Set(SHAPE_IDS);

export const isShapeId = (value: unknown): value is ShapeId =>
  typeof value === "string" && IDS.has(value);
