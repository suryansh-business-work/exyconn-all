import { describe, expect, it } from 'vitest';
import { finance } from '../../../src/seeds/finance';
import { checkSeedDeep } from './check-seed-deep';

describe('finance seed', () => {
  checkSeedDeep(finance, [
    'loan-enquiry',
    'insurance',
    'document-checklist',
    'advisor-appointment',
  ]);

  it('is the Kosh Finserv demo', () => {
    expect(finance.business.name).toBe('Kosh Finserv');
  });
});
