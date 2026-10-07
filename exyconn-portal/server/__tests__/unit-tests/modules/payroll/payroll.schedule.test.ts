import { randomUUID } from 'node:crypto';
import {
  readSchedule,
  runIfDue,
  startPayrollDispatch,
  targetPeriod,
  zonedParts,
} from '../../../../src/modules/payroll/payroll.schedule';
import { PayrollScheduleModel } from '../../../../src/modules/payroll/payroll-schedule.model';
import { SalarySlipModel } from '../../../../src/modules/employee/salarySlip.model';
import { AppSettingsModel } from '../../../../src/modules/admin/settings.model';
import { OrganizationModel } from '../../../../src/modules/organizations';
import { emailer } from '../../../../src/modules/email';
import { findBackgroundJob } from '../../../../src/modules/tech/jobs.registry';
import { JOB_KEYS, clearJobRuns, readJobRuns } from '../../../../src/utils/jobHeartbeat';
import { logger } from '../../../../src/utils/logger';
import { ROLES } from '../../../../src/constants/roles';
import { freezeClock, seedUser, useTestOrganization } from '../../../helpers';

useTestOrganization({ currency: 'INR', locale: 'en-IN', taxSystem: 'INDIA_GST' });

const MINUTE = 60_000;
/** 05:30 UTC on 1 September 2026 — 11:00 the same morning in Kolkata. */
const FIRST_OF_SEPTEMBER = '2026-09-01T05:30:00.000Z';

/** Polls for work the scheduler does behind the caller's back. */
async function until(check: () => boolean | Promise<boolean>): Promise<void> {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (await check()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('The scheduler never finished');
}

/** Intercepts only the once-a-minute timer, so the database driver keeps its own. */
function fakeMinuteTimer() {
  const unref = jest.fn();
  const realSetInterval = globalThis.setInterval;
  const spy = jest
    .spyOn(globalThis, 'setInterval')
    .mockImplementation(((handler: () => void, ms?: number) =>
      ms === MINUTE ? { unref } : realSetInterval(handler, ms)) as never);
  return { spy, unref };
}

async function augustSlip() {
  const user = await seedUser('august@exyconn.com', randomUUID(), [ROLES.EMPLOYEE]);
  await SalarySlipModel.create({
    employeeId: String(user._id),
    month: 8,
    year: 2026,
    currency: 'INR',
    gross: 10_000,
    deductions: 0,
    net: 10_000,
    issuedDate: new Date('2026-08-31T00:00:00.000Z'),
  });
}

/** Switched on, and otherwise the defaults: the previous month, sent on the 1st at 10:00. */
const dueSchedule = () => PayrollScheduleModel.create({ enabled: true });

let send: jest.SpyInstance;
beforeEach(() => {
  clearJobRuns();
  send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('targetPeriod and zonedParts', () => {
  it('sends the month before for any month but January', () => {
    const june = { year: 2026, month: 6, day: 1, hour: 10, minute: 0 };
    expect(targetPeriod('PREVIOUS_MONTH', june)).toEqual({ month: 5, year: 2026 });
  });

  it('reads a field the formatter leaves out as zero rather than as NaN', () => {
    jest.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts').mockReturnValue([]);
    const zero = { year: 0, month: 0, day: 0, hour: 0, minute: 0 };
    expect(zonedParts(new Date(FIRST_OF_SEPTEMBER), 'UTC')).toEqual(zero);
  });
});

describe('readSchedule', () => {
  it('creates the schedule switched off on first read, and returns the saved one after', async () => {
    expect(await readSchedule()).toMatchObject({
      enabled: false,
      dayOfMonth: 1,
      hour: 10,
      minute: 0,
      period: 'PREVIOUS_MONTH',
      lastRunPeriod: '',
    });
    await PayrollScheduleModel.updateOne({ key: 'global' }, { dayOfMonth: 5 });
    expect((await readSchedule()).dayOfMonth).toBe(5);
    expect(await PayrollScheduleModel.countDocuments()).toBe(1);
  });
});

describe('runIfDue', () => {
  it('sends the previous month on the company clock and records the run', async () => {
    freezeClock(FIRST_OF_SEPTEMBER);
    await AppSettingsModel.create({ timezone: 'Asia/Kolkata' });
    await dueSchedule();
    await augustSlip();

    await runIfDue();

    expect(send).toHaveBeenCalledTimes(1);
    expect(await PayrollScheduleModel.findOne({ key: 'global' }).lean()).toMatchObject({
      lastRunPeriod: '2026-08',
      lastSent: 1,
      lastFailed: 0,
      lastSkipped: 0,
      lastRunAt: new Date(FIRST_OF_SEPTEMBER),
    });
    expect(readJobRuns().get(JOB_KEYS.payrollDispatch)?.summary).toBe('Sent 1, failed 0');
  });

  it('stands down once the period has been sent', async () => {
    freezeClock(FIRST_OF_SEPTEMBER);
    await AppSettingsModel.create({ timezone: 'Asia/Kolkata' });
    await dueSchedule();
    await augustSlip();

    await runIfDue();
    await runIfDue();

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('reads the clock in UTC when no settings are saved, where 10:00 has not come yet', async () => {
    freezeClock(FIRST_OF_SEPTEMBER);
    await dueSchedule();
    await augustSlip();

    await runIfDue();

    expect(send).not.toHaveBeenCalled();
    expect((await PayrollScheduleModel.findOne().lean())?.lastRunPeriod).toBe('');
    expect(readJobRuns().has(JOB_KEYS.payrollDispatch)).toBe(false);
  });
});

describe('startPayrollDispatch', () => {
  it('checks every company at once and then once a minute', async () => {
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    const { spy, unref } = fakeMinuteTimer();

    startPayrollDispatch();
    // The first tick reads (and so creates) the company's schedule.
    await until(async () => (await PayrollScheduleModel.countDocuments()) === 1);

    expect(spy).toHaveBeenCalledWith(expect.any(Function), MINUTE);
    expect(unref).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith('Payslip dispatch scheduler started');
    expect(send).not.toHaveBeenCalled();
  });

  it('logs a check that could not run instead of throwing out of the timer', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    fakeMinuteTimer();
    jest.spyOn(OrganizationModel, 'find').mockImplementationOnce(() => {
      throw new Error('database unavailable');
    });

    startPayrollDispatch();
    await until(() => error.mock.calls.length > 0);

    expect(error).toHaveBeenCalledWith(expect.any(Error), 'Payslip dispatch check failed');
  });
});

describe('the payslip dispatch background job', () => {
  it('takes one due pass for the company in scope when run by hand', async () => {
    freezeClock(FIRST_OF_SEPTEMBER);
    await AppSettingsModel.create({ timezone: 'Asia/Kolkata' });
    await dueSchedule();
    await augustSlip();
    const job = findBackgroundJob(JOB_KEYS.payrollDispatch);

    expect(job?.label).toBe('Payslip dispatch');
    await job?.runOnce();

    expect(send).toHaveBeenCalledTimes(1);
  });
});
