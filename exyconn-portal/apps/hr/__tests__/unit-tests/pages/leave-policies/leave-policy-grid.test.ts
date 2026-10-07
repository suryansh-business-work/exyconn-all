import { describe, expect, it } from 'vitest';
import { countryName } from '@exyconn/i18n';
import {
  LEAVE_POLICY_COLUMNS,
  type PagedLeavePolicyRow,
} from '../../../../src/pages/leave-policies/leave-policy-grid';
import { actionKeys, columnIds, formatCell } from '../../harness/grid';

const policy: PagedLeavePolicyRow = {
  id: 'p1',
  name: 'Earned leave',
  code: 'EL',
  annualQuota: 18,
  paid: true,
  halfDayAllowed: true,
  carryForwardCap: 0,
  active: true,
  overrides: [
    { country: 'IN', annualQuota: 21, carryForwardCap: 5, active: true },
    { country: 'GB', annualQuota: 25, carryForwardCap: 0, active: false },
  ],
};

describe('LEAVE_POLICY_COLUMNS', () => {
  it('lays out the leave types with edit and delete at the end', () => {
    expect(columnIds(LEAVE_POLICY_COLUMNS)).toEqual([
      'name',
      'code',
      'annualQuota',
      'carryForwardCap',
      'active',
      'overrides',
      'actions',
    ]);
    expect(actionKeys(LEAVE_POLICY_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it('writes the quota and the carry-forward cap, zero included', () => {
    expect(formatCell(LEAVE_POLICY_COLUMNS, 'annualQuota', policy)).toBe('18');
    expect(formatCell(LEAVE_POLICY_COLUMNS, 'carryForwardCap', policy)).toBe('0');
  });

  it('writes a dash for a quota the row does not carry', () => {
    const partial = { ...policy, annualQuota: null, carryForwardCap: undefined } as never;
    expect(formatCell(LEAVE_POLICY_COLUMNS, 'annualQuota', partial)).toBe('—');
    expect(formatCell(LEAVE_POLICY_COLUMNS, 'carryForwardCap', partial)).toBe('—');
  });

  it('names the countries with their own terms', () => {
    expect(formatCell(LEAVE_POLICY_COLUMNS, 'overrides', policy)).toBe(
      `${countryName('IN')}, ${countryName('GB')}`,
    );
    expect(formatCell(LEAVE_POLICY_COLUMNS, 'overrides', { ...policy, overrides: [] })).toBe('');
  });
});
