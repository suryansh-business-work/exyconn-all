import { describe, expect, it } from 'vitest';
import { fitness } from '../../../src/seeds/fitness';
import { checkSeedDeep } from './check-seed-deep';

describe('fitness seed', () => {
  checkSeedDeep(fitness, ['gym-trial', 'personal-training', 'yoga', 'membership-renewal']);

  it('is the FitNation demo', () => {
    expect(fitness.business.name).toBe('FitNation');
  });
});
