import { LeavePolicyModel } from '../../src/modules/hrmaster/leavePolicy.model';
import { LeaveBalanceModel } from '../../src/modules/hrmaster/leaveBalance.model';
import { hrMasterResolvers } from '../../src/modules/hrmaster';
import { resolvers } from '../../src/graphql';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const ctx = (roles: string[]) =>
  ({ user: { id: 'emp-1', email: 'e@exyconn.com', roles } }) as unknown as GraphQLContext;

const Q = hrMasterResolvers.Query as unknown as Record<string, Resolver>;

describe('LeaveBalance.available', () => {
  const available = hrMasterResolvers.LeaveBalance.available;

  it('is allocation plus carry-forward plus adjustment, minus what was used', () => {
    expect(available({ allocated: 12, carriedForward: 3, adjustment: 0, used: 5 })).toBe(10);
  });

  it('honours a negative adjustment and can go to zero', () => {
    expect(available({ allocated: 10, carriedForward: 0, adjustment: -4, used: 6 })).toBe(0);
  });

  it('is reachable through the merged schema resolvers, not just the module', () => {
    const merged = resolvers as unknown as Record<string, Record<string, unknown>>;
    expect(typeof merged.LeaveBalance?.available).toBe('function');
  });
});

describe('activeLeavePolicies', () => {
  it('offers only the active policies, alphabetically', async () => {
    await LeavePolicyModel.create({ name: 'Sick Leave', code: 'SL', annualQuota: 8 });
    await LeavePolicyModel.create({ name: 'Casual Leave', code: 'CL', annualQuota: 12 });
    await LeavePolicyModel.create({ name: 'Retired Leave', code: 'RL', active: false });

    const rows = (await Q.activeLeavePolicies(null, {}, ctx([ROLES.EMPLOYEE]))) as {
      code: string;
    }[];
    expect(rows.map((r) => r.code)).toEqual(['CL', 'SL']);
  });
});

describe('leave balance access', () => {
  it('gives an employee only their own balances', async () => {
    await LeaveBalanceModel.create({
      employeeId: 'emp-1',
      leaveTypeCode: 'CL',
      year: 2026,
      allocated: 12,
    });
    await LeaveBalanceModel.create({
      employeeId: 'someone-else',
      leaveTypeCode: 'CL',
      year: 2026,
      allocated: 12,
    });

    const rows = (await Q.myLeaveBalances(null, {}, ctx([ROLES.EMPLOYEE]))) as {
      employeeId: string;
    }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].employeeId).toBe('emp-1');
  });

  it('keeps the HR-wide balance list away from a plain employee', async () => {
    await expect(Q.listLeaveBalances(null, {}, ctx([ROLES.EMPLOYEE]))).rejects.toThrow();
    await expect(Q.listLeaveBalances(null, {}, ctx([ROLES.HR]))).resolves.toBeDefined();
  });
});

describe('holiday administration', () => {
  it('leaves the employee-readable listHolidays alone', () => {
    // The employee module owns that query; the HR CRUD must not shadow it with a
    // role-guarded version, or every employee's holiday page would break.
    expect(Q.listHolidays).toBeUndefined();
    expect(typeof Q.listHolidaysPaged).toBe('function');
  });
});
