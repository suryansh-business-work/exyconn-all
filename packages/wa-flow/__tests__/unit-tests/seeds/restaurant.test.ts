import { describe, expect, it } from 'vitest';
import { restaurant } from '../../../src/seeds/restaurant';
import { checkSeedDeep } from './check-seed-deep';

describe('restaurant seed', () => {
  checkSeedDeep(restaurant, ['reserve', 'preorder', 'menu', 'my-table']);

  it('is the The Saffron Table demo', () => {
    expect(restaurant.business.name).toBe('The Saffron Table');
  });
});
