import { describe, expect, it } from 'vitest';
import { createDummy, hashSeed, startOfDay } from '../../../src/engine/dummy';
import { NOW } from './fixtures';

const DAY = 24 * 60 * 60 * 1000;
const MIDNIGHT = Date.UTC(2026, 9, 7);

describe('hashSeed', () => {
  it('is stable, starts from the FNV offset basis and tells strings apart', () => {
    expect(hashSeed('')).toBe(0x811c9dc5);
    expect(hashSeed('demo:asha')).toBe(hashSeed('demo:asha'));
    expect(hashSeed('demo:asha')).not.toBe(hashSeed('demo:ravi'));
    expect(hashSeed('😀')).toBeGreaterThanOrEqual(0);
  });
});

describe('startOfDay', () => {
  it('returns local midnight of the day', () => {
    expect(startOfDay(NOW)).toBe(MIDNIGHT);
    expect(startOfDay(MIDNIGHT)).toBe(MIDNIGHT);
  });
});

describe('createDummy', () => {
  it('gives the same values for the same seed', () => {
    const a = createDummy(42, NOW);
    const b = createDummy(42, NOW);
    expect([a.int(1, 100), a.id('CC'), a.price(500)]).toEqual([
      b.int(1, 100),
      b.id('CC'),
      b.price(500),
    ]);
  });

  it('keeps int and pick inside their range', () => {
    const data = createDummy(7, NOW);
    for (let i = 0; i < 50; i += 1) {
      const n = data.int(3, 5);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(5);
      expect(['x', 'y']).toContain(data.pick(['x', 'y']));
    }
  });

  it('builds ids from the prefix and an unambiguous alphabet', () => {
    expect(createDummy(1, NOW).id('BK')).toMatch(/^BK-[A-HJKMNP-Z2-9]{6}$/);
  });

  it('lists the next days from tomorrow, optionally skipping Sundays', () => {
    const data = createDummy(1, NOW);
    expect(data.nextDays(3)).toEqual([MIDNIGHT + DAY, MIDNIGHT + 2 * DAY, MIDNIGHT + 3 * DAY]);
    const working = data.nextDays(5, true);
    expect(working).toHaveLength(5);
    expect(working.map((d) => new Date(d).getUTCDay())).not.toContain(0);
    expect(working).not.toContain(MIDNIGHT + 4 * DAY);
  });

  it('only offers future slots, at most `take` of them', () => {
    const today = createDummy(3, NOW).slots(MIDNIGHT, 8, 12, 30, 10);
    expect(today.every((s) => s > NOW && s < MIDNIGHT + 12 * 60 * 60 * 1000)).toBe(true);
    const tomorrow = createDummy(3, NOW).slots(MIDNIGHT + DAY, 9, 18, 15, 4);
    expect(tomorrow).toHaveLength(4);
    expect(tomorrow.every((s) => (s - MIDNIGHT - DAY) % (15 * 60 * 1000) === 0)).toBe(true);
    expect(createDummy(3, NOW).slots(MIDNIGHT, 0, 9, 60, 5)).toEqual([]);
  });

  it('rounds prices to tens within the spread', () => {
    const data = createDummy(9, NOW);
    for (let i = 0; i < 30; i += 1) {
      const near = data.price(1000);
      expect(near % 10).toBe(0);
      expect(near).toBeGreaterThanOrEqual(900);
      expect(near).toBeLessThanOrEqual(1100);
      expect(data.price(1000, 0)).toBe(1000);
    }
  });
});
