import { Types } from 'mongoose';
import { UserModel } from '../../src/modules/admin/user.model';
import { HolidayModel } from '../../src/modules/employee/holiday.model';
import { LeavePolicyModel } from '../../src/modules/hrmaster/leavePolicy.model';
import { LeaveBalanceModel } from '../../src/modules/hrmaster/leaveBalance.model';
import { hrMasterResolvers } from '../../src/modules/hrmaster';
import { hrResolvers } from '../../src/modules/hr';
import { effectivePolicy } from '../../src/modules/hrmaster/leave-country';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';
import { useTestOrganization } from '../helpers';

// The company works from India unless an employee's own record says otherwise.
const ORGANIZATION = useTestOrganization({ country: 'IN' });

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = hrMasterResolvers.Query as unknown as Record<string, Resolver>;
const applyLeave = hrResolvers.Mutation.applyLeave as unknown as Resolver;

const ctx = (id: string) =>
  ({ user: { id, email: 'e@exyconn.com', roles: [ROLES.EMPLOYEE] } }) as unknown as GraphQLContext;

/** An employee, optionally employed in a country other than the company's. */
async function employee(country: string | null = null): Promise<string> {
  const user = await UserModel.create({
    name: 'Asha',
    email: `asha-${new Types.ObjectId().toHexString()}@exyconn.com`,
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
    country,
  });
  return String(user._id);
}

const casual = (over: Record<string, unknown> = {}) =>
  LeavePolicyModel.create({ name: 'Casual', code: 'CL', annualQuota: 12, ...over });

const codesOf = (rows: unknown) => (rows as { code: string }[]).map((row) => row.code);

describe('effectivePolicy', () => {
  const policy = {
    code: 'CL',
    annualQuota: 12,
    carryForwardCap: 5,
    active: true,
    overrides: [{ country: 'US', annualQuota: 10, carryForwardCap: 0, active: false }],
  };

  it("uses the country's override in full where one exists", () => {
    expect(effectivePolicy(policy, 'US')).toMatchObject({
      annualQuota: 10,
      carryForwardCap: 0,
      active: false,
    });
  });

  it('keeps the global terms for a country without an override', () => {
    expect(effectivePolicy(policy, 'IN')).toMatchObject({ annualQuota: 12, carryForwardCap: 5 });
  });
});

describe('activeLeavePolicies by country', () => {
  it("resolves the quota for the company's country when the employee has none", async () => {
    await casual({
      overrides: [{ country: 'IN', annualQuota: 8, carryForwardCap: 2, active: true }],
    });

    const rows = (await Q.activeLeavePolicies(null, {}, ctx(await employee()))) as {
      annualQuota: number;
    }[];

    expect(rows[0].annualQuota).toBe(8);
  });

  it("follows the employee's own country over the company's", async () => {
    await casual({
      overrides: [{ country: 'US', annualQuota: 0, carryForwardCap: 0, active: false }],
    });

    expect(codesOf(await Q.activeLeavePolicies(null, {}, ctx(await employee())))).toEqual(['CL']);
    expect(await Q.activeLeavePolicies(null, {}, ctx(await employee('US')))).toEqual([]);
  });

  it('offers a type switched off globally only in the country that switched it on', async () => {
    await casual({
      code: 'BL',
      name: 'Bereavement',
      active: false,
      overrides: [{ country: 'US', annualQuota: 3, carryForwardCap: 0, active: true }],
    });

    expect(codesOf(await Q.activeLeavePolicies(null, {}, ctx(await employee('US'))))).toEqual([
      'BL',
    ]);
    expect(await Q.activeLeavePolicies(null, {}, ctx(await employee()))).toEqual([]);
  });
});

describe('leave type overrides are validated', () => {
  it('refuses a code that is not a country', async () => {
    await expect(
      casual({ overrides: [{ country: 'XX', annualQuota: 1, carryForwardCap: 0, active: true }] }),
    ).rejects.toThrow(/not an ISO 3166-1 country/);
  });

  it('refuses the same country twice, on create and on update', async () => {
    const row = { country: 'IN', annualQuota: 1, carryForwardCap: 0, active: true };
    await expect(casual({ overrides: [row, row] })).rejects.toThrow(/overridden once/);

    const saved = await casual();
    await expect(
      LeavePolicyModel.findByIdAndUpdate(
        saved._id,
        { overrides: [row, row] },
        { runValidators: true },
      ),
    ).rejects.toThrow(/overridden once/);
  });
});

describe('myLeaveBalances', () => {
  it("creates this year's balance at the country quota for each metered type", async () => {
    const emp = await employee('US');
    await casual({
      overrides: [{ country: 'US', annualQuota: 10, carryForwardCap: 0, active: true }],
    });
    await casual({ name: 'Unpaid', code: 'UNPAID', annualQuota: 0 });

    const rows = (await Q.myLeaveBalances(null, {}, ctx(emp))) as {
      leaveTypeCode: string;
      allocated: number;
      year: number;
    }[];

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      leaveTypeCode: 'CL',
      allocated: 10,
      year: new Date().getUTCFullYear(),
    });
  });

  it('never overwrites a balance HR already allocated', async () => {
    const emp = await employee();
    await casual();
    const year = new Date().getUTCFullYear();
    await LeaveBalanceModel.create({ employeeId: emp, leaveTypeCode: 'CL', year, allocated: 3 });

    const rows = (await Q.myLeaveBalances(null, {}, ctx(emp))) as { allocated: number }[];

    expect(rows.map((row) => row.allocated)).toEqual([3]);
  });
});

describe('applyLeave', () => {
  const input = (type: string) => ({
    input: {
      type,
      fromDate: new Date('2026-03-02'),
      toDate: new Date('2026-03-03'),
      reason: 'Family',
    },
  });

  it('accepts a leave type offered in the employee’s country', async () => {
    await casual();
    const leave = (await applyLeave(null, input('CL'), ctx(await employee()))) as {
      status: string;
    };
    expect(leave.status).toBe('PENDING');
  });

  it('refuses a type the employee’s country does not offer', async () => {
    await casual({
      overrides: [{ country: 'US', annualQuota: 0, carryForwardCap: 0, active: false }],
    });
    await expect(applyLeave(null, input('CL'), ctx(await employee('US')))).rejects.toThrow(
      'CL is not a leave type you can apply for',
    );
  });
});

describe('myHolidays', () => {
  const holiday = (name: string, over: Record<string, unknown> = {}) =>
    HolidayModel.create({ name, date: new Date('2026-08-15'), ...over });

  it("shows company-wide holidays plus the employee's own country's", async () => {
    await holiday('Founders Day');
    await holiday('Independence Day', { country: 'IN' });
    await holiday('Thanksgiving', { country: 'US' });
    await holiday('Company Offsite', { excludedCountries: ['IN'] });

    const rows = (await Q.myHolidays(null, {}, ctx(await employee()))) as { name: string }[];

    expect(rows.map((row) => row.name).sort((a, b) => a.localeCompare(b))).toEqual([
      'Founders Day',
      'Independence Day',
    ]);
  });

  it('treats a holiday stored before countries existed as company-wide', async () => {
    await HolidayModel.collection.insertOne({
      name: 'Legacy',
      date: new Date('2026-01-01'),
      type: 'PUBLIC',
      organizationId: new Types.ObjectId(ORGANIZATION),
    });

    const rows = (await Q.myHolidays(null, {}, ctx(await employee('US')))) as {
      name: string;
      country?: string | null;
      excludedCountries?: string[] | null;
    }[];
    const resolve = hrMasterResolvers.Holiday;

    expect(rows.map((row) => row.name)).toEqual(['Legacy']);
    expect(resolve.country(rows[0])).toBe('');
    expect(resolve.excludedCountries(rows[0])).toEqual([]);
  });
});
