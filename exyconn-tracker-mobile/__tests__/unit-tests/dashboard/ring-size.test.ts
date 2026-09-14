import { describe, expect, it } from 'vitest';
import { ringDiameter } from '../../../src/lib/dashboard/ring-size';

const BASE = 116;
const PHONE = 360;

describe('ringDiameter', () => {
  it('keeps the designed size at the default text size', () => {
    expect(ringDiameter(BASE, 1, PHONE)).toBe(BASE);
  });

  it('never shrinks below the designed size for smaller text', () => {
    expect(ringDiameter(BASE, 0.85, PHONE)).toBe(BASE);
  });

  it('grows with the text size', () => {
    expect(ringDiameter(BASE, 1.5, PHONE)).toBe(174);
  });

  it('stops at a share of the window so it still fits a phone at 200% text', () => {
    expect(ringDiameter(BASE, 2, PHONE)).toBeCloseTo(216);
  });
});
