import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EMPLOYEE_BILLING_CSV,
  PROJECT_BILLING_CSV,
  monthRange,
  moneyFormat,
  projectBillingLines,
  toDateOrNull,
} from '../../../../src/pages/tracker/tracker.billing';
import { billingRow, projectRow } from './tracker.fixtures';

const cells = <Row>(columns: ReadonlyArray<{ value: (row: Row) => unknown }>, row: Row) =>
  columns.map((column) => column.value(row));

describe('monthRange', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens on the current calendar month, from its first day to the next month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 20, 15, 30));
    expect(monthRange()).toEqual({
      from: new Date(2026, 4, 1).toISOString(),
      to: new Date(2026, 5, 1).toISOString(),
    });
  });

  it('rolls December over into January of the next year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 31, 23, 59));
    expect(monthRange()).toEqual({
      from: new Date(2026, 11, 1).toISOString(),
      to: new Date(2027, 0, 1).toISOString(),
    });
  });
});

describe('toDateOrNull', () => {
  it('passes a real date through untouched', () => {
    const date = new Date('2026-03-04T00:00:00.000Z');
    expect(toDateOrNull(date)).toBe(date);
  });

  it('turns an empty picker or a half-typed date into null', () => {
    expect(toDateOrNull(null)).toBeNull();
    expect(toDateOrNull(new Date('not a date'))).toBeNull();
  });
});

describe('moneyFormat', () => {
  it('formats in the currency the report came back in, to two decimals at most', () => {
    const options = moneyFormat('EUR').resolvedOptions();
    expect(options.style).toBe('currency');
    expect(options.currency).toBe('EUR');
    expect(options.maximumFractionDigits).toBe(2);
  });

  it('writes a plain number when neither the report nor the company names a currency', () => {
    const options = moneyFormat(undefined).resolvedOptions();
    expect(options.style).toBe('decimal');
    expect(options.currency).toBeUndefined();
  });
});

describe('EMPLOYEE_BILLING_CSV', () => {
  it('carries the same cells the per-employee table shows', () => {
    expect(EMPLOYEE_BILLING_CSV.map((column) => column.header)).toEqual([
      'Employee',
      'Email',
      'Pay type',
      'Hours',
      'Rate / hour',
      'Amount',
      'Currency',
    ]);
    expect(cells(EMPLOYEE_BILLING_CSV, billingRow())).toEqual([
      'Asha Rao',
      'asha@example.test',
      'HOURLY',
      12.5,
      40,
      500,
      'USD',
    ]);
  });

  it('leaves the rate blank for an employee nobody priced', () => {
    const row = billingRow({ rated: false, billingRate: 0, amount: 0 });
    expect(cells(EMPLOYEE_BILLING_CSV, row)[4]).toBe('');
  });
});

describe('projectBillingLines', () => {
  it('writes one line per employee per project, keyed by both', () => {
    const lines = projectBillingLines([
      projectRow(),
      projectRow({
        projectId: 'p2',
        projectName: 'Audit',
        clientName: '',
        budgetHours: undefined,
        budgetAmount: null,
        employees: [{ employeeId: 'e3', employeeName: 'Ravi', hours: 4, rate: 0, amount: 0 }],
      }),
    ]);
    expect(lines.map((line) => line.id)).toEqual(['p1:e1', 'p1:e2', 'p2:e3']);
    expect(lines[0]).toEqual({
      id: 'p1:e1',
      projectName: 'Website rebuild',
      clientName: 'Acme',
      employeeName: 'Asha Rao',
      hours: 20,
      rate: 40,
      amount: 800,
      currency: 'USD',
      budgetHours: 100,
      budgetAmount: 5000,
    });
    expect(lines[2].budgetHours).toBeNull();
    expect(lines[2].budgetAmount).toBeNull();
  });

  it('returns nothing for a period with no booked time', () => {
    expect(projectBillingLines([])).toEqual([]);
    expect(projectBillingLines([projectRow({ employees: [] })])).toEqual([]);
  });
});

describe('PROJECT_BILLING_CSV', () => {
  it('writes the project, client, employee, money and budget columns', () => {
    const [priced, unpriced] = projectBillingLines([
      projectRow({
        employees: [
          { employeeId: 'e1', employeeName: 'Asha Rao', hours: 20, rate: 40, amount: 800 },
          { employeeId: 'e2', employeeName: 'Dev Mehta', hours: 5, rate: 0, amount: 0 },
        ],
      }),
    ]);
    expect(PROJECT_BILLING_CSV.map((column) => column.header)).toEqual([
      'Project',
      'Client',
      'Employee',
      'Hours',
      'Rate / hour',
      'Amount',
      'Currency',
      'Budget hours',
      'Budget amount',
    ]);
    expect(cells(PROJECT_BILLING_CSV, priced)).toEqual([
      'Website rebuild',
      'Acme',
      'Asha Rao',
      20,
      40,
      800,
      'USD',
      100,
      5000,
    ]);
    expect(cells(PROJECT_BILLING_CSV, unpriced)[4]).toBe('');
  });
});
