import { describe, expect, it } from 'vitest';
import { realEstate } from '../../../src/seeds/real-estate';
import { checkSeedDeep } from './check-seed-deep';

describe('real-estate seed', () => {
  checkSeedDeep(realEstate, ['find', 'visit', 'callback', 'loan']);

  it('is the Skyline Realty demo', () => {
    expect(realEstate.business.name).toBe('Skyline Realty');
  });
});
