/**
 * Quality tiers for the decorative WebGL scenes. A phone or a low-memory laptop gets fewer
 * objects and a lower pixel ratio; nothing about the page's content depends on the tier.
 */
export type QualityTier = 'low' | 'medium' | 'high';

export interface QualitySettings {
  readonly tier: QualityTier;
  /** Upper bound for the renderer's pixel ratio. */
  readonly dprCap: number;
  readonly cubes: number;
  readonly particles: number;
  readonly antialias: boolean;
}

export interface DeviceSignals {
  /** navigator.hardwareConcurrency */
  readonly cores?: number;
  /** navigator.deviceMemory (GB), Chromium only */
  readonly memory?: number;
  /** Viewport width in CSS px. */
  readonly width: number;
}

const SETTINGS: Readonly<Record<QualityTier, QualitySettings>> = {
  low: { tier: 'low', dprCap: 1, cubes: 36, particles: 260, antialias: false },
  medium: { tier: 'medium', dprCap: 1.5, cubes: 64, particles: 520, antialias: false },
  high: { tier: 'high', dprCap: 2, cubes: 110, particles: 1100, antialias: true },
};

export function pickTier({ cores = 4, memory = 4, width }: DeviceSignals): QualityTier {
  const weak = cores <= 4 || memory <= 4;
  if (width < 768) {
    return weak ? 'low' : 'medium';
  }
  return weak ? 'medium' : 'high';
}

export function qualityFor(signals: DeviceSignals): QualitySettings {
  return SETTINGS[pickTier(signals)];
}

/** The settings for this browser. */
export function detectQuality(): QualitySettings {
  const nav = globalThis.navigator as Navigator & { deviceMemory?: number };
  return qualityFor({ cores: nav.hardwareConcurrency, memory: nav.deviceMemory, width: globalThis.innerWidth });
}

/** Scale a count for a smaller variant (e.g. the tool-page band), never below 1. */
export const scaled = (count: number, factor: number): number => Math.max(1, Math.round(count * factor));
