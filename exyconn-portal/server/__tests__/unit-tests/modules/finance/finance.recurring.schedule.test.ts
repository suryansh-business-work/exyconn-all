import {
  generateDueInvoices,
  startRecurringInvoiceSchedule,
} from '../../../../src/modules/finance/finance.recurring';
import { RecurringInvoiceModel } from '../../../../src/modules/finance/recurring-invoice.model';
import { InvoiceModel } from '../../../../src/modules/finance/finance.model';
import { OrganizationModel } from '../../../../src/modules/organizations';
import { findBackgroundJob } from '../../../../src/modules/tech/jobs.registry';
import { JOB_KEYS, clearJobRuns, readJobRuns } from '../../../../src/utils/jobHeartbeat';
import { logger } from '../../../../src/utils/logger';
import { useTestOrganization } from '../../../helpers';

useTestOrganization();

const HOUR = 60 * 60_000;
const NOW = new Date('2026-03-02T00:00:00.000Z');

const schedule = (extra: Record<string, unknown> = {}) =>
  RecurringInvoiceModel.create({
    name: 'Acme retainer',
    clientId: 'client-1',
    clientName: 'Acme Ltd',
    lines: [{ description: 'Support', quantity: 1, rate: 100, taxPercent: 0 }],
    currency: 'USD',
    frequency: 'MONTHLY',
    startDate: new Date('2026-03-01T00:00:00.000Z'),
    nextRunAt: new Date('2026-03-01T00:00:00.000Z'),
    dueDays: 30,
    active: true,
    ...extra,
  });

/** Polls for work the schedule deliberately does behind the caller's back. */
async function until(check: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (check()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('The recurring check never finished');
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

beforeEach(() => clearJobRuns());
afterEach(() => jest.restoreAllMocks());

describe('generateDueInvoices', () => {
  it('keeps the claim when writing the invoice fails, so the period is never billed twice', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const row = await schedule();
    jest.spyOn(InvoiceModel, 'create').mockRejectedValueOnce(new Error('disk full'));

    await expect(generateDueInvoices(NOW)).resolves.toBe(0);

    expect(error).toHaveBeenCalledWith(
      expect.any(Error),
      'Recurring invoice for "Acme retainer" failed',
    );
    expect(await InvoiceModel.countDocuments()).toBe(0);
    const after = await RecurringInvoiceModel.findById(row._id).lean();
    expect(after?.generatedCount).toBe(1);
    expect(after?.nextRunAt).toEqual(new Date('2026-04-01T00:00:00.000Z'));
    expect(readJobRuns().get(JOB_KEYS.recurringInvoices)?.summary).toBe('0 invoice(s) raised');
  });

  it('raises nothing when another process claimed the period first', async () => {
    await schedule();
    jest.spyOn(RecurringInvoiceModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

    await expect(generateDueInvoices(NOW)).resolves.toBe(0);
    expect(await InvoiceModel.countDocuments()).toBe(0);
  });

  it('stops at twenty invoices in one tick, however many schedules are behind', async () => {
    const longAgo = new Date('2019-01-01T00:00:00.000Z');
    await schedule({ startDate: longAgo, nextRunAt: longAgo });
    await schedule({ name: 'Globex retainer', startDate: longAgo, nextRunAt: longAgo });

    await expect(generateDueInvoices(NOW)).resolves.toBe(20);

    expect(await InvoiceModel.countDocuments()).toBe(20);
    expect(readJobRuns().get(JOB_KEYS.recurringInvoices)?.summary).toBe('20 invoice(s) raised');
  });

  it('reads a schedule that has lost its lines and place of supply as an empty draft', async () => {
    const row = await schedule();
    await RecurringInvoiceModel.collection.updateOne(
      { _id: row._id },
      { $unset: { lines: '', placeOfSupplyStateCode: '' } },
    );

    await expect(generateDueInvoices(NOW)).resolves.toBe(1);

    expect(await InvoiceModel.findOne().lean()).toMatchObject({
      amount: 0,
      lines: [],
      placeOfSupplyStateCode: '',
    });
  });
});

describe('startRecurringInvoiceSchedule', () => {
  it('raises what is due in every company at once and then checks hourly', async () => {
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    const { spy, unref } = fakeHourlyTimer();
    const due = new Date(Date.now() - HOUR);
    await schedule({ startDate: due, nextRunAt: due });

    startRecurringInvoiceSchedule();
    await until(() => readJobRuns().has(JOB_KEYS.recurringInvoices));

    expect(readJobRuns().get(JOB_KEYS.recurringInvoices)?.summary).toBe('1 invoice(s) raised');
    expect(await InvoiceModel.countDocuments()).toBe(1);
    expect(spy).toHaveBeenCalledWith(expect.any(Function), HOUR);
    expect(unref).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith('Recurring invoice schedule started');
  });

  it('logs a check that could not run instead of throwing out of the timer', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    fakeHourlyTimer();
    jest.spyOn(OrganizationModel, 'find').mockImplementationOnce(() => {
      throw new Error('database unavailable');
    });

    startRecurringInvoiceSchedule();
    await until(() => error.mock.calls.length > 0);

    expect(error).toHaveBeenCalledWith(expect.any(Error), 'Recurring invoice check failed');
  });
});

describe('the recurring background job', () => {
  it('raises the due periods for the company in scope when run by hand', async () => {
    const job = findBackgroundJob(JOB_KEYS.recurringInvoices);
    const due = new Date(Date.now() - HOUR);
    await schedule({ startDate: due, nextRunAt: due });

    expect(job?.label).toBe('Recurring invoices');
    await expect(job?.runOnce()).resolves.toBe(1);
  });
});
