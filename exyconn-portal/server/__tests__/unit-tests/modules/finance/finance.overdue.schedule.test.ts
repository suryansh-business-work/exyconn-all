import { startOverdueSweep } from '../../../../src/modules/finance/finance.overdue';
import { InvoiceModel } from '../../../../src/modules/finance/finance.model';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { OrganizationModel } from '../../../../src/modules/organizations';
import { findBackgroundJob } from '../../../../src/modules/tech/jobs.registry';
import { JOB_KEYS, clearJobRuns, readJobRuns } from '../../../../src/utils/jobHeartbeat';
import { logger } from '../../../../src/utils/logger';
import { useTestOrganization } from '../../../helpers';

useTestOrganization({ currency: 'INR', locale: 'en-IN' });

jest.mock('../../../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));

const DAY = 86_400_000;
const HOUR = 60 * 60_000;

/** Polls for work the sweep deliberately does behind the caller's back. */
async function until(check: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (check()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('The sweep never finished');
}

/** Intercepts only the hourly timer, so the database driver keeps its own. */
function fakeHourlyTimer() {
  const unref = jest.fn();
  const realSetInterval = globalThis.setInterval;
  const spy = jest
    .spyOn(globalThis, 'setInterval')
    .mockImplementation(((handler: () => void, ms?: number) =>
      ms === HOUR ? { unref } : realSetInterval(handler, ms)) as never);
  return { spy, unref };
}

const seedInvoice = (number: string, clientId: string, dueInDays: number) =>
  InvoiceModel.create({
    number,
    clientId,
    clientName: 'Nimbus Ltd',
    amount: 1000,
    amountPaid: 0,
    currency: 'INR',
    status: 'SENT',
    issuedDate: new Date(Date.now() - 40 * DAY),
    dueDate: new Date(Date.now() + dueInDays * DAY),
  });

beforeEach(() => clearJobRuns());
afterEach(() => jest.restoreAllMocks());

describe('startOverdueSweep', () => {
  it('sweeps every company at once, reports the totals, and schedules itself hourly', async () => {
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    const { spy, unref } = fakeHourlyTimer();
    const client = await ClientModel.create({
      name: 'Nimbus Ltd',
      email: 'accounts@nimbus.test',
      company: 'Nimbus Ltd',
      status: 'ACTIVE',
    });
    const late = await seedInvoice('INV-LATE', 'client-1', -5);
    await seedInvoice('INV-SOON', client._id.toHexString(), 2);

    startOverdueSweep();
    await until(() => readJobRuns().has(JOB_KEYS.overdueInvoices));

    expect(readJobRuns().get(JOB_KEYS.overdueInvoices)?.summary).toBe(
      '1 marked overdue, 0 cleared, 0 chased, 1 reminded',
    );
    expect((await InvoiceModel.findById(late._id).lean())?.status).toBe('OVERDUE');
    expect(spy).toHaveBeenCalledWith(expect.any(Function), HOUR);
    expect(unref).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith('Overdue invoice sweep started');
  });

  it('logs a sweep that could not run instead of throwing out of the timer', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    fakeHourlyTimer();
    jest.spyOn(OrganizationModel, 'find').mockImplementationOnce(() => {
      throw new Error('database unavailable');
    });

    startOverdueSweep();
    await until(() => error.mock.calls.length > 0);

    expect(error).toHaveBeenCalledWith(expect.any(Error), 'Overdue invoice sweep failed');
    expect(readJobRuns().has(JOB_KEYS.overdueInvoices)).toBe(false);
  });
});

describe('the overdue background job', () => {
  it('takes one pass for the company in scope when run by hand', async () => {
    const job = findBackgroundJob(JOB_KEYS.overdueInvoices);
    await seedInvoice('INV-LATE', 'client-1', -5);

    expect(job?.label).toBe('Overdue invoices and chasing');
    await expect(job?.runOnce()).resolves.toEqual({ marked: 1, cleared: 0, chased: 0 });
  });
});
