import { describe, expect, it } from 'vitest';
import { CLOUD_COLUMNS } from '../../../../src/pages/cloud/cloud-grid';
import { cloudRow } from '../../core/rows.fixtures';
import { actionKeys, formatCell, headersOf } from '../../core/grid.helpers';

describe('CLOUD_COLUMNS', () => {
  it('reads name, kind, provider, environment, expiry, cost and status', () => {
    expect(headersOf(CLOUD_COLUMNS)).toEqual([
      'Name',
      'Kind',
      'Provider',
      'Environment',
      'Expires',
      'Monthly cost',
      'Status',
      '',
    ]);
    expect(actionKeys(CLOUD_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it('dashes a resource that never expires and dates one that does', () => {
    expect(formatCell(CLOUD_COLUMNS, 'expiresAt', cloudRow(), null)).toBe('—');
    expect(formatCell(CLOUD_COLUMNS, 'expiresAt', cloudRow(), '2027-03-01')).toBe('on 2027-03-01');
  });

  it('writes the monthly cost as a grouped number, and nothing while the row loads', () => {
    const row = cloudRow({ monthlyCost: 12500 });
    expect(formatCell(CLOUD_COLUMNS, 'monthlyCost', row)).toBe((12500).toLocaleString());
    expect(formatCell(CLOUD_COLUMNS, 'monthlyCost', undefined)).toBe('');
  });
});
