import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { PayrollCandidateStatus } from '@exyconn/shell/graphql/generated';
import { useCandidateSelection } from '../../../../../src/pages/payroll/run-dialog/useCandidateSelection';
import { EMPLOYEES, candidate } from './run-plan-fixture';

const pickedIds = (result: { current: ReturnType<typeof useCandidateSelection> }) =>
  result.current.picked.map((c) => c.employeeId);

describe('useCandidateSelection', () => {
  it('starts with every ready employee picked and nobody else', () => {
    const { result } = renderHook(() => useCandidateSelection(EMPLOYEES));

    expect(pickedIds(result)).toEqual(['e1', 'e3']);
    expect(result.current.readyCount).toBe(2);
    expect(result.current.allPicked).toBe(true);
    expect(result.current.somePicked).toBe(false);
    expect(result.current.isPicked('e1')).toBe(true);
    expect(result.current.isPicked('e2')).toBe(false);
    expect(result.current.totals).toEqual({ count: 2, gross: 80000, deductions: 3500, net: 76500 });
  });

  it('unticks and re-ticks one employee, keeping the totals in step', () => {
    const { result } = renderHook(() => useCandidateSelection(EMPLOYEES));

    act(() => result.current.toggle('e1'));
    expect(pickedIds(result)).toEqual(['e3']);
    expect(result.current.somePicked).toBe(true);
    expect(result.current.allPicked).toBe(false);
    expect(result.current.totals.net).toBe(29000);

    act(() => result.current.toggle('e1'));
    expect(pickedIds(result)).toEqual(['e1', 'e3']);
  });

  it('never picks somebody who is not ready, even when toggled', () => {
    const { result } = renderHook(() => useCandidateSelection(EMPLOYEES));

    act(() => result.current.toggle('e4'));

    expect(result.current.isPicked('e4')).toBe(true);
    expect(pickedIds(result)).toEqual(['e1', 'e3']);
  });

  it('clears everybody when all are picked, and picks everybody when not', () => {
    const { result } = renderHook(() => useCandidateSelection(EMPLOYEES));

    act(() => result.current.toggleAll());
    expect(pickedIds(result)).toEqual([]);
    expect(result.current.somePicked).toBe(false);

    act(() => result.current.toggle('e3'));
    act(() => result.current.toggleAll());
    expect(pickedIds(result)).toEqual(['e1', 'e3']);
  });

  it('is never "all picked" with nobody ready', () => {
    const blocked = [candidate('e2', 'Bala', PayrollCandidateStatus.AlreadyRun)];
    const { result } = renderHook(() => useCandidateSelection(blocked));

    expect(result.current.readyCount).toBe(0);
    expect(result.current.allPicked).toBe(false);
    expect(result.current.somePicked).toBe(false);
  });
});
