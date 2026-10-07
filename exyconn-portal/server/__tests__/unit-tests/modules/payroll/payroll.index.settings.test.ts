import { payrollResolvers } from '../../../../src/modules/payroll';
import { PayrollScheduleModel } from '../../../../src/modules/payroll/payroll-schedule.model';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import type { GraphQLContext } from '../../../../src/middleware/auth';

useTestOrganization({ currency: 'INR', locale: 'en-IN', taxSystem: 'INDIA_GST' });

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = payrollResolvers.Query as unknown as Record<string, Resolver>;
const M = payrollResolvers.Mutation as unknown as Record<string, Resolver>;

const as = (roles: string[]) =>
  ({ user: { id: 'u-1', email: 'u@exyconn.com', roles } }) as unknown as GraphQLContext;
const hr = as([ROLES.HR]);
const finance = as([ROLES.FINANCE]);
const employee = as([ROLES.EMPLOYEE]);

const schedule = {
  enabled: true,
  dayOfMonth: 28,
  hour: 23,
  minute: 59,
  period: 'CURRENT_MONTH',
};

const policy = {
  pfEnabled: true,
  pfEmployeePercent: 12,
  pfWageCeiling: 15_000,
  esiEnabled: true,
  esiEmployeePercent: 0.75,
  esiWageLimit: 21_000,
  professionalTaxMonthly: 200,
  tdsMode: 'SLAB',
  tdsFlatPercent: 0,
};

describe('payrollSchedule', () => {
  it('reads the default schedule to Finance and refuses a plain employee', async () => {
    await expect(Q.payrollSchedule(null, {}, finance)).resolves.toMatchObject({
      enabled: false,
      period: 'PREVIOUS_MONTH',
    });
    await expect(Q.payrollSchedule(null, {}, employee)).rejects.toThrow();
  });
});

describe('updatePayrollSchedule', () => {
  it('saves the last valid day, hour and minute, and keeps one schedule', async () => {
    await expect(M.updatePayrollSchedule(null, { input: schedule }, hr)).resolves.toMatchObject(
      schedule,
    );
    await M.updatePayrollSchedule(
      null,
      { input: { ...schedule, dayOfMonth: 1, hour: 0, minute: 0 } },
      hr,
    );

    expect(await PayrollScheduleModel.countDocuments()).toBe(1);
    expect(await PayrollScheduleModel.findOne().lean()).toMatchObject({
      dayOfMonth: 1,
      hour: 0,
      minute: 0,
    });
  });

  it.each([
    [{ dayOfMonth: 0 }, 'dayOfMonth must be 1-28 so it exists in every month'],
    [{ dayOfMonth: 29 }, 'dayOfMonth must be 1-28 so it exists in every month'],
    [{ hour: -1 }, 'hour must be 0-23'],
    [{ hour: 24 }, 'hour must be 0-23'],
    [{ minute: -1 }, 'minute must be 0-59'],
    [{ minute: 60 }, 'minute must be 0-59'],
    [{ period: 'NEXT_MONTH' }, 'period must be PREVIOUS_MONTH or CURRENT_MONTH'],
  ])('refuses %j', async (change, message) => {
    await expect(
      M.updatePayrollSchedule(null, { input: { ...schedule, ...change } }, hr),
    ).rejects.toThrow(message);
    expect(await PayrollScheduleModel.countDocuments()).toBe(0);
  });

  it('refuses a plain employee', async () => {
    await expect(M.updatePayrollSchedule(null, { input: schedule }, employee)).rejects.toThrow();
  });
});

describe('updatePayrollSettings', () => {
  it('saves the regime and the month the financial year opens in', async () => {
    await expect(
      M.updatePayrollSettings(
        null,
        { input: { ...policy, tdsRegimeKey: 'OLD', financialYearStartMonth: 1 } },
        hr,
      ),
    ).resolves.toMatchObject({ tdsMode: 'SLAB', tdsRegimeKey: 'OLD', financialYearStartMonth: 1 });
    await expect(
      M.updatePayrollSettings(null, { input: { ...policy, financialYearStartMonth: 12 } }, hr),
    ).resolves.toMatchObject({ financialYearStartMonth: 12 });
  });

  it.each([
    [{ esiEmployeePercent: -1 }, 'esiEmployeePercent must be between 0 and 100'],
    [{ tdsFlatPercent: 101 }, 'tdsFlatPercent must be between 0 and 100'],
    [{ pfWageCeiling: -1 }, 'pfWageCeiling cannot be negative'],
    [{ esiWageLimit: -5 }, 'esiWageLimit cannot be negative'],
    [{ professionalTaxMonthly: -200 }, 'professionalTaxMonthly cannot be negative'],
    [{ tdsRegimeKey: '   ' }, 'tdsRegimeKey must name a regime in the tax table'],
    [{ financialYearStartMonth: 0 }, 'financialYearStartMonth must be 1-12'],
    [{ financialYearStartMonth: 13 }, 'financialYearStartMonth must be 1-12'],
  ])('refuses %j', async (change, message) => {
    await expect(
      M.updatePayrollSettings(null, { input: { ...policy, ...change } }, hr),
    ).rejects.toThrow(message);
  });

  it('is HR’s alone: Finance may read the policy but not change it', async () => {
    await expect(Q.payrollSettings(null, {}, finance)).resolves.toMatchObject({ pfEnabled: true });
    await expect(M.updatePayrollSettings(null, { input: policy }, finance)).rejects.toThrow();
  });
});
