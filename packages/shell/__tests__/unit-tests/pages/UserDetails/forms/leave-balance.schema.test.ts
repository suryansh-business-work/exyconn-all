import { describe, expect, it } from 'vitest';
import { availableOf, leaveBalanceSchema } from '@/pages/UserDetails/forms/leave-balance';
import { toFormValues } from '@/pages/UserDetails/forms/leave-balance/leave-balance.schema';

const valid = { leaveTypeCode: 'CL', allocated: 12, carriedForward: 2, adjustment: 0, used: 3 };

/** The first message the schema gives for one field, or undefined when it passes. */
function messageFor(values: Record<string, unknown>, field: string): string | undefined {
  const result = leaveBalanceSchema.safeParse(values);
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message;
}

describe('availableOf', () => {
  it('adds what was granted and takes off what was used', () => {
    expect(availableOf({ allocated: 12, carriedForward: 2, adjustment: -1, used: 3 })).toBe(10);
  });
});

describe('leaveBalanceSchema', () => {
  it('accepts a balance and coerces typed numbers', () => {
    const parsed = leaveBalanceSchema.parse({ ...valid, allocated: '12', leaveTypeCode: ' CL ' });
    expect(parsed).toEqual({ ...valid, allocated: 12 });
  });

  it('needs a leave type', () => {
    expect(messageFor({ ...valid, leaveTypeCode: '  ' }, 'leaveTypeCode')).toBe(
      'Choose a leave type',
    );
  });

  it('names the field in every number rule', () => {
    expect(messageFor({ ...valid, allocated: 'abc' }, 'allocated')).toBe(
      'Allocated must be a number',
    );
    expect(messageFor({ ...valid, used: 1.5 }, 'used')).toBe('Used must be whole days');
    expect(messageFor({ ...valid, carriedForward: -1 }, 'carriedForward')).toBe(
      'Carried forward cannot be negative',
    );
    expect(messageFor({ ...valid, allocated: 367 }, 'allocated')).toBe('Allocated is too high');
  });

  it('lets an adjustment go negative down to a year of days', () => {
    expect(messageFor({ ...valid, allocated: 366, adjustment: -366, used: 0 }, 'adjustment')).toBe(
      undefined,
    );
    expect(messageFor({ ...valid, adjustment: -367 }, 'adjustment')).toBe('Adjustment is too low');
  });

  it('refuses a balance that would go below zero', () => {
    expect(messageFor({ ...valid, used: 15 }, 'adjustment')).toBe(
      'This would leave fewer than 0 days available',
    );
    expect(messageFor({ ...valid, used: 14 }, 'adjustment')).toBe(undefined);
  });
});

describe('toFormValues', () => {
  it('starts a new balance at zero with no type', () => {
    expect(toFormValues(null)).toEqual({
      leaveTypeCode: '',
      allocated: 0,
      carriedForward: 0,
      adjustment: 0,
      used: 0,
    });
  });

  it('copies a held balance', () => {
    const row = { id: 'b-1', employeeId: 'emp-1', year: 2026, available: 11, ...valid };
    expect(toFormValues(row)).toEqual(valid);
  });
});
