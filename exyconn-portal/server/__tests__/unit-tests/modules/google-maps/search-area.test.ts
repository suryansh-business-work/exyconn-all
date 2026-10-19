import {
  assertPolygon,
  boundsOf,
  insidePolygon,
  MAX_POLYGON_POINTS,
} from '../../../../src/modules/google-maps/search-area';

/** A square around central Pune. */
const square = [
  { lat: 18.5, lng: 73.8 },
  { lat: 18.5, lng: 73.9 },
  { lat: 18.6, lng: 73.9 },
  { lat: 18.6, lng: 73.8 },
];

describe('assertPolygon', () => {
  it('accepts a triangle up to the most points a drawn area may have', () => {
    expect(() => assertPolygon(square.slice(0, 3))).not.toThrow();
    const many = Array.from({ length: MAX_POLYGON_POINTS }, (_v, i) => ({ lat: i, lng: i }));
    expect(() => assertPolygon(many)).not.toThrow();
    expect(() => assertPolygon([{ lat: 90, lng: -180 }, ...square.slice(0, 2)])).not.toThrow();
  });

  it('refuses fewer than three points and more than the maximum', () => {
    expect(() => assertPolygon(square.slice(0, 2))).toThrow('Draw the area with 3 to 50 points');
    const tooMany = Array.from({ length: MAX_POLYGON_POINTS + 1 }, (_v, i) => ({ lat: i, lng: 0 }));
    expect(() => assertPolygon(tooMany)).toThrow('Draw the area with 3 to 50 points');
  });

  it('refuses a point off the map or not a number', () => {
    for (const bad of [
      { lat: 90.1, lng: 0 },
      { lat: 0, lng: -180.5 },
      { lat: Number.NaN, lng: 0 },
      { lat: 0, lng: Number.POSITIVE_INFINITY },
    ]) {
      expect(() => assertPolygon([...square.slice(0, 2), bad])).toThrow(
        'The drawn area has a point off the map.',
      );
    }
  });
});

describe('boundsOf', () => {
  it('is the rectangle around every point', () => {
    expect(boundsOf([...square, { lat: 18.55, lng: 73.95 }])).toEqual({
      low: { latitude: 18.5, longitude: 73.8 },
      high: { latitude: 18.6, longitude: 73.95 },
    });
  });
});

describe('insidePolygon', () => {
  it('keeps a point inside the shape and drops one in the box but outside it', () => {
    const triangle = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 10 },
      { lat: 10, lng: 0 },
    ];
    expect(insidePolygon({ lat: 2, lng: 2 }, triangle)).toBe(true);
    // In the bounding box, past the diagonal edge.
    expect(insidePolygon({ lat: 8, lng: 8 }, triangle)).toBe(false);
    expect(insidePolygon({ lat: 18.55, lng: 73.85 }, square)).toBe(true);
    expect(insidePolygon({ lat: 18.7, lng: 73.85 }, square)).toBe(false);
    expect(insidePolygon({ lat: 18.55, lng: 74 }, square)).toBe(false);
  });
});
