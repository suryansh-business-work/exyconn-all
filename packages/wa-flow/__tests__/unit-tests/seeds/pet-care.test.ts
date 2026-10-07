import { describe, expect, it } from 'vitest';
import { petCare } from '../../../src/seeds/pet-care';
import { checkSeedDeep } from './check-seed-deep';

describe('pet-care seed', () => {
  checkSeedDeep(petCare, ['vet-appointment', 'grooming', 'vaccination', 'pet-profile']);

  it('is the PawPal Pet Clinic & Spa demo', () => {
    expect(petCare.business.name).toBe('PawPal Pet Clinic & Spa');
  });
});
