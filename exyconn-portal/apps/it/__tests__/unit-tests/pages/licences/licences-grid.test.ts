import { describe, expect, it } from 'vitest';
import { LicenceBillingCycle, LicenceStatus } from '@exyconn/shell/graphql/generated';
import { LICENCE_COLUMNS } from '../../../../src/pages/licences/licences-grid';
import {
  LICENCE_BILLING_CYCLES,
  LICENCE_STATUSES,
  RENEWAL_WINDOW_DAYS,
} from '../../../../src/pages/licences/licences.constants';
import { licenceRow } from '../page-kit/fixtures';
import { actionSpecs, columnIds, formatCell } from '../page-kit/grid';

describe('LICENCE_COLUMNS', () => {
  it('lists the licence register columns, with the actions last', () => {
    expect(columnIds(LICENCE_COLUMNS)).toEqual([
      'name',
      'vendor',
      'seats',
      'cost',
      'billingCycle',
      'renewalDate',
      'status',
      'actions',
    ]);
  });

  it('shows seats as used of total', () => {
    const row = licenceRow({ seatsTotal: 8, assigneeIds: ['a', 'b', 'c'] });
    expect(formatCell(LICENCE_COLUMNS, 'seats', row)).toBe('3 / 8');
  });

  it('writes the cost in the viewer number format', () => {
    const row = licenceRow({ cost: 12500 });
    expect(formatCell(LICENCE_COLUMNS, 'cost', row)).toBe((12500).toLocaleString());
  });

  it('writes nothing while a row is still loading', () => {
    expect(formatCell(LICENCE_COLUMNS, 'seats', undefined)).toBe('');
    expect(formatCell(LICENCE_COLUMNS, 'cost', undefined)).toBe('');
  });

  it('offers edit and delete', () => {
    expect(actionSpecs(LICENCE_COLUMNS).map((spec) => spec.key)).toEqual(['edit', 'delete']);
  });
});

describe('licence constants', () => {
  it('mirror the server enums and a 30 day renewal window', () => {
    expect(LICENCE_BILLING_CYCLES).toEqual(Object.values(LicenceBillingCycle));
    expect(LICENCE_STATUSES).toEqual(Object.values(LicenceStatus));
    expect(RENEWAL_WINDOW_DAYS).toBe(30);
  });
});
