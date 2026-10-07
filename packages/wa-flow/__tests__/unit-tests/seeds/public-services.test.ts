import { describe, expect, it } from 'vitest';
import { publicServices } from '../../../src/seeds/public-services';
import { checkSeedDeep } from './check-seed-deep';

describe('public-services seed', () => {
  checkSeedDeep(publicServices, ['token', 'status', 'checklist', 'complaint'], {
    seeds: ['a', 'b', 'c', 'd'],
    followMenu: false,
  });

  it('is the Sundarpur Civic Centre demo', () => {
    expect(publicServices.business.name).toBe('Sundarpur Civic Centre');
  });
});
