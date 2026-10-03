import { describe, it, expect } from 'vitest';
import { pickTier, qualityFor, scaled } from '../shared/three/quality';

describe('scene quality tiers', () => {
  it.each([
    [{ cores: 8, memory: 8, width: 1440 }, 'high'],
    [{ cores: 4, memory: 8, width: 1440 }, 'medium'],
    [{ cores: 8, memory: 8, width: 390 }, 'medium'],
    [{ cores: 4, memory: 4, width: 390 }, 'low'],
    [{ width: 390 }, 'low'],
  ] as const)('%o -> %s', (signals, tier) => {
    expect(pickTier(signals)).toBe(tier);
  });

  it('caps the pixel ratio lower on weaker tiers', () => {
    expect(qualityFor({ cores: 2, width: 390 }).dprCap).toBe(1);
    expect(qualityFor({ cores: 16, memory: 16, width: 1920 }).dprCap).toBe(2);
  });

  it('scales counts but never to zero', () => {
    expect(scaled(100, 0.3)).toBe(30);
    expect(scaled(1, 0.01)).toBe(1);
  });
});
