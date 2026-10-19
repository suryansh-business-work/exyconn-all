import { describe, expect, it } from 'vitest';
import { DEMO_PHOTOS } from '../../../src/page/demoPhotos';

describe('DEMO_PHOTOS', () => {
  it('gives every photo a bundled image, a description and its Pexels page', () => {
    expect(Object.keys(DEMO_PHOTOS)).toEqual(['team', 'caller', 'chat']);
    for (const photo of Object.values(DEMO_PHOTOS)) {
      expect(photo.src).toMatch(/\.jpg$/);
      expect(photo.alt.length).toBeGreaterThan(10);
      expect(photo.sourceUrl).toMatch(/^https:\/\/www\.pexels\.com\/photo\/\d+\/$/);
    }
  });
});
