import { describe, expect, it } from 'vitest';
import {
  SALARY_STRUCTURE_COLUMNS,
  type PagedSalaryStructureRow,
} from '../../../../src/pages/salaries/salary-structure-grid';
import { PayType } from '@exyconn/shell/graphql/generated';
import { actionKeys, columnIds, formatCell } from '../../harness/grid';

const row: PagedSalaryStructureRow = {
  id: 'salary-1',
  employeeId: 'user-1',
  currency: 'INR',
  payType: PayType.Fixed,
  basic: 50000,
  hra: 20000,
  allowances: 5000,
  deductions: 2000,
  rate: 0,
  billingRate: 0,
  gross: 75000,
  net: 73000,
  pfApplicable: false,
  esiApplicable: false,
  tdsPercent: 0,
  taxExempt: false,
  effectiveFrom: '2026-04-01T00:00:00.000Z',
};

const hourly: PagedSalaryStructureRow = {
  ...row,
  payType: PayType.Hourly,
  rate: 900,
  billingRate: 2500,
};

const cells = (value: PagedSalaryStructureRow | undefined) =>
  ['basic', 'rate', 'billingRate', 'gross', 'net'].map((id) =>
    formatCell(SALARY_STRUCTURE_COLUMNS, id, value),
  );

describe('SALARY_STRUCTURE_COLUMNS', () => {
  it('lays out the register with edit and delete at the end', () => {
    expect(columnIds(SALARY_STRUCTURE_COLUMNS)).toEqual([
      'employeeName',
      'currency',
      'payType',
      'basic',
      'rate',
      'billingRate',
      'gross',
      'net',
      'effectiveFrom',
      'actions',
    ]);
    expect(actionKeys(SALARY_STRUCTURE_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it('shows a fixed salary by its components, with a dash for the unused rate and bill-out', () => {
    expect(cells(row)).toEqual(['50000', '—', '—', '75000', '73000']);
  });

  it('shows the hourly rate and what an hour is billed at', () => {
    expect(cells(hourly)).toEqual(['50000', '900', '2500', '75000', '73000']);
  });

  it('shows a dash for figures the server left out', () => {
    const missing = { ...row, basic: null, gross: null, net: null } as never;

    expect(cells(missing)).toEqual(['—', '—', '—', '—', '—']);
  });

  it('writes nothing while the row is still loading', () => {
    expect(cells(undefined)).toEqual(['', '', '', '', '']);
  });

  it('names the employee through the grid context rather than showing the id', () => {
    const nameOf = (id: string) => (id === 'user-1' ? 'Asha Rao' : id);

    expect(formatCell(SALARY_STRUCTURE_COLUMNS, 'employeeName', row, { nameOf })).toBe('Asha Rao');
  });
});
