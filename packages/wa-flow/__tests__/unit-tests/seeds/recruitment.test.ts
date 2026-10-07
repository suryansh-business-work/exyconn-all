import { describe, expect, it } from 'vitest';
import { recruitment } from '../../../src/seeds/recruitment';
import { checkSeedDeep } from './check-seed-deep';

describe('recruitment seed', () => {
  checkSeedDeep(recruitment, ['apply', 'interview', 'documents', 'status'], {
    seeds: ['a', 'b', 'c', 'd'],
    followMenu: true,
  });

  it('is the Kaveri Talent Partners demo', () => {
    expect(recruitment.business.name).toBe('Kaveri Talent Partners');
  });
});
