import { describe, expect, it } from 'vitest';
import { healthcare } from '../../../src/seeds/healthcare';
import { checkSeedDeep } from './check-seed-deep';

describe('healthcare seed', () => {
  checkSeedDeep(healthcare, ['appointment', 'lab-test', 'vaccination', 'follow-up', 'report']);

  it('is the CityCare Hospital demo', () => {
    expect(healthcare.business.name).toBe('CityCare Hospital');
  });
});
