import { describe, expect, it } from 'vitest';
import { isLatitude, isLongitude, kmToMetres } from '../../../src/maps/radius';

describe('radius helpers', () => {
  it('turns kilometres into whole metres', () => {
    expect(kmToMetres(1.2345)).toBe(1235);
  });

  it('accepts only coordinates on the globe', () => {
    expect([isLatitude(90), isLatitude(-90.1), isLatitude(Number.NaN)]).toEqual([
      true,
      false,
      false,
    ]);
    expect([isLongitude(-180), isLongitude(180.5)]).toEqual([true, false]);
  });
});
