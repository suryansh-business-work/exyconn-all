import { describe, expect, it } from 'vitest';
import { COMPANY_COLUMNS } from '../../../../src/pages/companies/companies-grid';
import { COMPANY_SIZES } from '../../../../src/pages/companies/crm.constants';
import { companyRow } from '../../fixtures';
import { actionSpecs, columnIds, isActionHidden } from '../../grid-helpers';

describe('COMPANY_COLUMNS', () => {
  it('lists the company register columns, with the actions last', () => {
    expect(columnIds(COMPANY_COLUMNS)).toEqual([
      'name',
      'domain',
      'industry',
      'size',
      'status',
      'isClient',
      'owner',
      'actions',
    ]);
  });

  it('offers make client, edit and delete, in that order', () => {
    expect(actionSpecs(COMPANY_COLUMNS).map((spec) => spec.key)).toEqual([
      'makeClient',
      'edit',
      'delete',
    ]);
  });

  it('offers make client only until the company is a client', () => {
    expect(isActionHidden(COMPANY_COLUMNS, 'makeClient', companyRow({ isClient: false }))).toBe(
      false,
    );
    expect(isActionHidden(COMPANY_COLUMNS, 'makeClient', companyRow({ isClient: true }))).toBe(
      true,
    );
  });
});

describe('COMPANY_SIZES', () => {
  it('mirrors the server size bands, smallest first', () => {
    expect(COMPANY_SIZES).toEqual(['1-10', '11-50', '51-200', '201-1000', '1000+']);
  });
});
