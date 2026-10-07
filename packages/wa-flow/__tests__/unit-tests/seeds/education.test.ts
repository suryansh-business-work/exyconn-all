import { describe, expect, it } from 'vitest';
import { education } from '../../../src/seeds/education';
import { checkSeed } from './check-seed';

describe('education seed', () => {
  checkSeed(education, ['demo', 'counselling', 'admission', 'fees']);

  it('is BrightPath Academy', () => {
    expect(education.business.name).toBe('BrightPath Academy');
  });
});
