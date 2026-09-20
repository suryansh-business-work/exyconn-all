import { InvoiceModel, NOT_YET_LATE_STATUSES } from './finance.model';
import { chaseOverdueInvoices } from './finance.dunning';
import { forEachOrganization } from '../organizations';
import { logger } from '../../utils/logger';
import { JOB_KEYS, recordJobRun } from '../../utils/jobHeartbeat';
import { registerBackgroundJob } from '../tech/jobs.registry';

/** How often the process asks which invoices have gone late. */
const TICK_MS = 60 * 60_000;

const DAY_MS = 86_400_000;

/**
 * Only invoices with money still on them. `amountPaid` is missing entirely on rows written
 * before payments existed, so it is coalesced rather than compared — a null comparison in
 * Mongo is not false, it is a different value altogether, and the invoices from before the
 * ledger are exactly the old ones most likely to be late.
 */
const STILL_OWED = { $expr: { $gt: ['$amount', { $ifNull: ['$amountPaid', 0] }] } };

/** What one sweep changed, for the heartbeat line and the tests. */
export interface OverdueSweepResult {
  /** Invoices that have just been declared late. */
  marked: number;
  /** Invoices no longer late, because somebody moved the due date out. */
  cleared: number;
  /** Chase emails sent to customers this tick. */
  chased: number;
}

/**
 * The instant an invoice must have been due before to read as late.
 *
 * A whole day, not "any time after midnight on the due date", because `daysLate` in
 * finance.billing.ts floors to whole days and the ageing report calls a lateness of zero
 * CURRENT. Marking an invoice OVERDUE two hours after its due date would have the status
 * chip on the grid say OVERDUE while the ageing report beside it counted the same invoice
 * as not yet due — two screens, one invoice, two answers. The cutoff is the report's.
 */
function lateBefore(now: Date): Date {
  return new Date(now.getTime() - DAY_MS);
}

/**
 * Writes the OVERDUE status the rest of finance has always assumed somebody was writing.
 *
 * OVERDUE was in the status list, the invoices screen counted a tile of it and the ageing
 * report was built on it, but nothing ever set it: the only way an invoice could carry it
 * was for a person to pick it out of a dropdown. This is the job that makes it true.
 *
 * It runs in both directions. Going late is the obvious half; coming back is not, and
 * matters just as much — an invoice whose due date somebody pushes out in agreement with
 * the customer must stop reading as overdue immediately, or finance is chasing a debt the
 * business has already agreed to wait for. Being settled is not handled here at all: a
 * payment that clears the balance is `settleStatus`'s to write, in the same save as the
 * money, rather than something the invoice waits up to an hour for.
 */
export async function markOverdueInvoices(now = new Date()): Promise<OverdueSweepResult> {
  const cutoff = lateBefore(now);

  const marked = await InvoiceModel.updateMany(
    { status: { $in: NOT_YET_LATE_STATUSES }, dueDate: { $lte: cutoff }, ...STILL_OWED },
    { status: 'OVERDUE' },
  );

  // Back out of OVERDUE, to whichever status the money says it should be. Two updates
  // rather than one because the answer differs by whether anything has been paid, and a
  // part-paid invoice that came back from overdue is PARTIALLY_PAID, not SENT.
  const partlyPaid = await InvoiceModel.updateMany(
    { status: 'OVERDUE', dueDate: { $gt: cutoff }, amountPaid: { $gt: 0 } },
    { status: 'PARTIALLY_PAID' },
  );
  const untouched = await InvoiceModel.updateMany(
    {
      status: 'OVERDUE',
      dueDate: { $gt: cutoff },
      $or: [{ amountPaid: { $lte: 0 } }, { amountPaid: null }],
    },
    { status: 'SENT' },
  );

  return {
    marked: marked.modifiedCount,
    cleared: partlyPaid.modifiedCount + untouched.modifiedCount,
    chased: 0,
  };
}

/**
 * One pass over the receivables: declare what has gone late, then chase what is still owed.
 *
 * In that order, in one function, because the chase reads the status the marking writes —
 * an invoice that fell due overnight is marked and, if it is far enough past its date,
 * chased in the same tick rather than an hour later.
 */
export async function sweepOverdueInvoices(now = new Date()): Promise<OverdueSweepResult> {
  const result = await markOverdueInvoices(now);
  return { ...result, chased: await chaseOverdueInvoices(now) };
}

/** Starts the hourly receivables sweep across every company. */
export function startOverdueSweep(): void {
  const tick = () => {
    const totals = { marked: 0, cleared: 0, chased: 0 };
    forEachOrganization(async () => {
      const result = await sweepOverdueInvoices();
      totals.marked += result.marked;
      totals.cleared += result.cleared;
      totals.chased += result.chased;
    }, 'Overdue invoices')
      .then(() =>
        recordJobRun(
          JOB_KEYS.overdueInvoices,
          `${totals.marked} marked overdue, ${totals.cleared} cleared, ${totals.chased} chased`,
        ),
      )
      .catch((error: unknown) => logger.error(error, 'Overdue invoice sweep failed'));
  };
  tick();
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('Overdue invoice sweep started');
}

registerBackgroundJob({
  key: JOB_KEYS.overdueInvoices,
  label: 'Overdue invoices and chasing',
  description: 'Marks what has gone late, clears what has not, and sends the due chases.',
  runOnce: () => sweepOverdueInvoices(),
});
