import { distanceMetres } from '../../../src/utils/geo';

describe('distanceMetres', () => {
  const bengaluru = { lat: 12.9716, lng: 77.5946 };

  it('is zero between a point and itself', () => {
    expect(distanceMetres(bengaluru, bengaluru)).toBe(0);
  });

  it('measures one degree of latitude as about 111.2 km', () => {
    const north = { lat: bengaluru.lat + 1, lng: bengaluru.lng };
    expect(distanceMetres(bengaluru, north)).toBeCloseTo(111_195, -1);
  });

  it('is the same in both directions', () => {
    const delhi = { lat: 28.6139, lng: 77.209 };
    expect(distanceMetres(bengaluru, delhi)).toBeCloseTo(distanceMetres(delhi, bengaluru), 6);
    // Bengaluru to New Delhi is roughly 1,740 km as the crow flies.
    expect(distanceMetres(bengaluru, delhi) / 1000).toBeCloseTo(1740, -1);
  });

  it('tells a 200 m move apart from staying put', () => {
    // 0.0018° of latitude is about 200 m.
    const nearby = { lat: bengaluru.lat + 0.0018, lng: bengaluru.lng };
    expect(distanceMetres(bengaluru, nearby)).toBeGreaterThan(195);
    expect(distanceMetres(bengaluru, nearby)).toBeLessThan(205);
  });

  it('stays finite for antipodal points, half the circumference apart', () => {
    const far = distanceMetres({ lat: 0, lng: 0 }, { lat: 0, lng: 180 });
    expect(far).toBeCloseTo(Math.PI * 6_371_000, 0);
  });
});
