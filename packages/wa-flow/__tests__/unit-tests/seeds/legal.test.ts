import { describe, expect, it } from 'vitest';
import { legal } from '../../../src/seeds/legal';
import { checkSeedDeep } from './check-seed-deep';

describe('legal seed', () => {
  checkSeedDeep(legal, ['consultation', 'case-category', 'document-collection', 'follow-up']);

  it('is the Lexora Legal Associates demo', () => {
    expect(legal.business.name).toBe('Lexora Legal Associates');
  });
});
