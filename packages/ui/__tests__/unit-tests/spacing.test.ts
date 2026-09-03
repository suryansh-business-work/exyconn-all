import { describe, it, expect } from 'vitest';
import { space } from '../../src/spacing/spacing';

describe('spacing', () => {
  it('derives named sizes from the 8px unit', () => {
    expect(space.xs).toBe(4);
    expect(space.md).toBe(16);
    expect(space.xl).toBe(32);
  });

  it('scales xs < sm < md < lg < xl', () => {
    expect(space.xs).toBeLessThan(space.sm);
    expect(space.sm).toBeLessThan(space.md);
    expect(space.md).toBeLessThan(space.lg);
    expect(space.lg).toBeLessThan(space.xl);
  });
});
