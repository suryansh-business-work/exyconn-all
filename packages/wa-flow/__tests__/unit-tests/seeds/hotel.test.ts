import { describe, expect, it } from 'vitest';
import { hotel } from '../../../src/seeds/hotel';
import { checkSeedDeep } from './check-seed-deep';

describe('hotel seed', () => {
  checkSeedDeep(hotel, ['rooms', 'book', 'check-in', 'stay-help']);

  it('is the Coral Bay Resort demo', () => {
    expect(hotel.business.name).toBe('Coral Bay Resort');
  });
});
