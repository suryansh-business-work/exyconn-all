import { describe, expect, it } from 'vitest';
import { PayrollCandidateStatus } from '@exyconn/shell/graphql/generated';
import { isReady, runBlocker, totalsOf } from '../../../../../src/pages/payroll/run-dialog/runPlan';
import { EMPLOYEES, candidate, planOf } from './run-plan-fixture';

describe('isReady', () => {
  it('is true only for an employee the run can issue a slip to', () => {
    expect(EMPLOYEES.map(isReady)).toEqual([true, false, true, false]);
  });
});

describe('totalsOf', () => {
  it('adds up the count, gross, deductions and net of the picked employees', () => {
    expect(totalsOf(EMPLOYEES.filter(isReady))).toEqual({
      count: 2,
      gross: 80000,
      deductions: 3500,
      net: 76500,
    });
  });

  it('counts an employee with no figures as zero money', () => {
    const noFigures = candidate('e9', 'Ira', PayrollCandidateStatus.Ready);
    expect(totalsOf([noFigures])).toEqual({ count: 1, gross: 0, deductions: 0, net: 0 });
  });

  it('is all zeros for nobody picked', () => {
    expect(totalsOf([])).toEqual({ count: 0, gross: 0, deductions: 0, net: 0 });
  });
});

describe('runBlocker', () => {
  it('says when a month that has not opened yet will open', () => {
    expect(runBlocker(planOf(EMPLOYEES, { open: false }), 'October 2026', '25 Oct 2026')).toEqual({
      message: 'Payroll for {period} opens on {date}',
      values: { period: 'October 2026', date: '25 Oct 2026' },
    });
  });

  it('lets an open month with somebody ready be run', () => {
    expect(runBlocker(planOf(), 'October 2026', '25 Oct 2026')).toBeNull();
  });

  it('says the month is done when everybody has already been run', () => {
    const plan = planOf([candidate('e2', 'Bala', PayrollCandidateStatus.AlreadyRun)]);
    expect(runBlocker(plan, 'October 2026', '25 Oct 2026')).toEqual({
      message: 'Payroll has already been run for every employee this month',
    });
  });

  it('points to Salaries when nobody has a salary structure', () => {
    const plan = planOf([candidate('e4', 'Dev', PayrollCandidateStatus.NoStructure)]);
    expect(runBlocker(plan, 'October 2026', '25 Oct 2026')).toEqual({
      message: 'No employee has a salary structure yet — add one under Salaries',
    });
  });
});
