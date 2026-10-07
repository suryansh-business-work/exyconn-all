import { describe, expect, it } from 'vitest';
import { homeServices } from '../../../src/seeds/home-services';
import { checkSeedDeep } from './check-seed-deep';

describe('home-services seed', () => {
  checkSeedDeep(
    homeServices,
    ['book-service', 'describe-problem', 'track-booking', 'care-plans', 'invoice'],
    { seeds: ['a'], followMenu: true },
  );

  it('is the HomeEase Services demo', () => {
    expect(homeServices.business.name).toBe('HomeEase Services');
  });
});
