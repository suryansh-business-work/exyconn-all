import { describe, it, expect } from 'vitest';
import { spacing, radius, duration, fontWeight } from '../../src/tokens/tokens';

describe('tokens', () => {
  it('derives spacing from the 8px unit', () => {
    expect(spacing(1)).toBe(8);
    expect(spacing(3)).toBe(24);
  });

  it('scales radius sm < md < lg', () => {
    expect(radius.sm).toBeLessThan(radius.md);
    expect(radius.md).toBeLessThan(radius.lg);
  });

  it('scales duration fast < base < slow', () => {
    expect(duration.fast).toBeLessThan(duration.base);
    expect(duration.base).toBeLessThan(duration.slow);
  });

  it('matches the theme font weight scale', () => {
    expect(fontWeight).toEqual({ regular: 400, medium: 600, bold: 800 });
  });
});
