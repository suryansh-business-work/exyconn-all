import { describe, expect, it } from 'vitest';
import { automobile } from '../../../src/seeds/automobile';
import { checkSeed } from './check-seed';

describe('automobile seed', () => {
  checkSeed(automobile, ['service-booking', 'pickup', 'service-status', 'test-drive']);

  it('is the AutoNova dealership', () => {
    expect(automobile.business.name).toBe('AutoNova Motors');
  });
});
