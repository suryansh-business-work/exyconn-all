import { describe, expect, it } from 'vitest';
import { retail } from '../../../src/seeds/retail';
import { checkSeedDeep } from './check-seed-deep';

describe('retail seed', () => {
  checkSeedDeep(retail, ['shop', 'track-order', 'returns', 'cod-confirm'], {
    seeds: ['a', 'b', 'c', 'd'],
    followMenu: false,
  });

  it('is the Bazaarly demo', () => {
    expect(retail.business.name).toBe('Bazaarly');
  });
});
