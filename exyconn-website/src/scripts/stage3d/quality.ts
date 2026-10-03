/**
 * How much scene a device gets. Picked once at boot from the viewport and what the browser
 * reports about the hardware, then refined by `adaptPixelRatio` if frames run long.
 */
export interface DeviceProfile {
  width: number;
  devicePixelRatio: number;
  /** `navigator.hardwareConcurrency` — absent in some browsers. */
  cores?: number;
  /** `navigator.deviceMemory` in GB — Chromium only. */
  memoryGb?: number;
  reducedMotion: boolean;
}

export type TierName = "low" | "mobile" | "balanced" | "high";

export interface QualityTier {
  name: TierName;
  /** Points in the morphing protagonist. */
  particles: number;
  stars: number;
  /** Neural filaments drawn between the core's nodes (0 = none). */
  filaments: number;
  /** Points in each background plane, robot or satellite. */
  ambientPoints: number;
  /** fbm octaves in the nebula shader. */
  nebulaOctaves: number;
  /** Canvas resolution, already capped. */
  pixelRatio: number;
  minPixelRatio: number;
  /** False under prefers-reduced-motion: one still frame per chapter, no parallax. */
  animate: boolean;
}

/** Below this width the layout is a single column and the scene is simplified. */
export const COMPACT_WIDTH = 768;
const WIDE_WIDTH = 1600;

type TierShape = Omit<QualityTier, "pixelRatio" | "animate"> & { maxPixelRatio: number };

const TIERS: Record<TierName, TierShape> = {
  low: {
    name: "low",
    particles: 5000,
    stars: 600,
    filaments: 0,
    ambientPoints: 160,
    nebulaOctaves: 2,
    maxPixelRatio: 1,
    minPixelRatio: 0.75,
  },
  mobile: {
    name: "mobile",
    particles: 7000,
    stars: 900,
    filaments: 0,
    ambientPoints: 220,
    nebulaOctaves: 2,
    maxPixelRatio: 1.25,
    minPixelRatio: 0.75,
  },
  balanced: {
    name: "balanced",
    particles: 16000,
    stars: 1800,
    filaments: 180,
    ambientPoints: 500,
    nebulaOctaves: 3,
    maxPixelRatio: 1.25,
    minPixelRatio: 1,
  },
  high: {
    name: "high",
    particles: 24000,
    stars: 2600,
    filaments: 320,
    ambientPoints: 700,
    nebulaOctaves: 4,
    maxPixelRatio: 1.5,
    minPixelRatio: 1,
  },
};

const isWeak = ({ cores, memoryGb }: DeviceProfile): boolean =>
  (cores ?? 4) <= 4 || (memoryGb ?? 4) <= 4;

const pickTierName = (profile: DeviceProfile): TierName => {
  const weak = isWeak(profile);
  if (profile.width < COMPACT_WIDTH) {
    return weak ? "low" : "mobile";
  }
  if (weak) {
    return "balanced";
  }
  return profile.width >= WIDE_WIDTH ? "high" : "balanced";
};

export const selectQualityTier = (profile: DeviceProfile): QualityTier => {
  const { maxPixelRatio, ...tier } = TIERS[pickTierName(profile)];
  return {
    ...tier,
    pixelRatio: Math.min(profile.devicePixelRatio, maxPixelRatio),
    animate: !profile.reducedMotion,
  };
};

/** Frames slower than this (ms, averaged) cost the canvas a step of resolution. */
export const SLOW_FRAME_MS = 22;

/** One step down when frames run long, never below the tier's floor; otherwise unchanged. */
export const adaptPixelRatio = (averageFrameMs: number, current: number, floor: number): number =>
  averageFrameMs > SLOW_FRAME_MS
    ? Math.max(floor, Math.round((current - 0.25) * 100) / 100)
    : current;

/**
 * Inner pages get half the home budget: one explanatory shape in the hero, not a five-act
 * story. Phones keep DPR ≤ 1.25 and lose the fbm nebula (0 octaves = CSS gradient only);
 * desktops may go to 1.5.
 */
const INNER_MAX_PIXEL_RATIO = { compact: 1.25, wide: 1.5 } as const;

export const selectInnerTier = (profile: DeviceProfile): QualityTier => {
  const home = selectQualityTier(profile);
  const compact = profile.width < COMPACT_WIDTH;
  const maxPixelRatio = compact ? INNER_MAX_PIXEL_RATIO.compact : INNER_MAX_PIXEL_RATIO.wide;
  return {
    ...home,
    particles: Math.round(home.particles / 2),
    stars: Math.round(home.stars / 2),
    filaments: Math.round(home.filaments / 2),
    ambientPoints: 0,
    nebulaOctaves: compact ? 0 : home.nebulaOctaves - 1,
    pixelRatio: Math.min(profile.devicePixelRatio, maxPixelRatio),
  };
};

/** Save-Data or a device reporting 2 GB or less keeps the static CSS gradient. */
export const LOW_MEMORY_GB = 2;

export const wantsStaticScene = (profile: DeviceProfile, saveData: boolean): boolean =>
  saveData || (profile.memoryGb ?? Infinity) <= LOW_MEMORY_GB;
