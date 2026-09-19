import { isValidObjectId } from 'mongoose';
import { InvoiceModel } from './finance.model';
import { daysLate } from './finance.billing';
import { ClientModel } from '../clients/clients.model';
import { claimReminder } from '../reminders';
import { emailer } from '../email';
import { companyProfile } from '../../lib/company';
import { formatAmount } from '../../utils/money';
import { logger } from '../../utils/logger';

/**
 * How long after the due date the customer hears from us, in days.
 *
 * Three stages, spaced so the chase escalates rather than nags: a note within the week
 * that reads as a reminder, a firmer one a fortnight later, and one at a month that says
 * the account is now seriously overdue. Daily email would be ignored by the second week
 * and would make an accounts department dread the sender; three letters over a month is
 * what a collections process actually looks like.
 *
 * Written in ascending order, which `dunningStage` relies on to pick the latest stage an
 * invoice has reached.
 */
export const DUNNING_STAGE_DAYS = [3, 14, 30] as const;

/** The reminder source these chases are logged under, shared with the in-app notices. */
export const RECEIVABLES_SOURCE = 'finance-receivables';

/**
 * The latest stage an invoice this late has reached, or null before the first one.
 *
 * The latest rather than each in turn: an invoice that first comes into view forty days
 * late — raised in a system that was off, or one whose date was corrected — gets the
 * thirty-day letter, not all three in the same hour.
 */
export function dunningStage(late: number): number | null {
  const reached = DUNNING_STAGE_DAYS.filter((days) => late >= days);
  return reached.length > 0 ? reached[reached.length - 1] : null;
}

/** An overdue invoice, reduced to what the letter prints. */
interface ChaseTarget {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  currency: string;
  balance: number;
  dueDate: Date;
  late: number;
  stage: number;
}

/** Money to two places — see the note on round2 in finance.billing.ts. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Everything overdue that has reached a stage, with the stage it has reached. */
async function targets(now: Date): Promise<ChaseTarget[]> {
  const rows = await InvoiceModel.find({ status: 'OVERDUE' })
    .select('number clientId clientName currency amount amountPaid dueDate')
    .lean();

  const found: ChaseTarget[] = [];
  for (const row of rows) {
    const balance = round2(row.amount - (row.amountPaid ?? 0));
    const late = daysLate(row.dueDate, now);
    const stage = dunningStage(late);
    // A settled invoice is never chased. It should not be OVERDUE at all — `settleStatus`
    // writes PAID the moment the balance clears — but the letter is the one thing here a
    // customer sees, so it checks the money itself rather than trusting a status field.
    if (stage !== null && balance > 0) {
      found.push({
        id: String(row._id),
        number: row.number,
        clientId: row.clientId,
        clientName: row.clientName ?? '',
        currency: row.currency,
        balance,
        dueDate: row.dueDate,
        late,
        stage,
      });
    }
  }
  return found;
}

/** Where to write, by client id. A client with no address on file cannot be chased. */
async function emailsByClient(clientIds: string[]): Promise<Map<string, string>> {
  const ids = [...new Set(clientIds)].filter((id) => isValidObjectId(id));
  if (ids.length === 0) {
    return new Map();
  }
  const clients = await ClientModel.find({ _id: { $in: ids } })
    .select('email')
    .lean();
  return new Map(
    clients.filter((client) => Boolean(client.email)).map((c) => [String(c._id), c.email]),
  );
}

/** Sends one stage's letter. Failures are logged, never thrown: the sweep chases the rest. */
async function sendChase(target: ChaseTarget, to: string, locale: string): Promise<boolean> {
  try {
    await emailer.send({
      template: 'invoice-overdue',
      to,
      variables: {
        clientName: target.clientName || 'there',
        invoiceNumber: target.number,
        balanceDue: formatAmount(target.balance, target.currency, locale),
        dueDate: target.dueDate.toISOString().slice(0, 10),
        daysLate: String(target.late),
      },
      triggeredBy: 'Overdue invoice sweep',
    });
    return true;
  } catch (error) {
    logger.error(error, `Overdue chase for invoice ${target.number} could not be sent`);
    return false;
  }
}

/**
 * Chases every overdue invoice that has reached a stage it has not been chased at yet.
 *
 * The stage is claimed through the reminder log before the email goes out, under a key of
 * invoice and stage: the sweep runs hourly and an invoice stays forty days late for ten
 * days, so without the claim the same letter would go to the customer every hour. Claiming
 * first means a send that fails burns that stage rather than risking the same letter
 * twice — a customer who is emailed the same demand repeatedly stops reading any of them,
 * and the failure is in the email log and the server log for somebody to act on, with the
 * next stage still to come.
 */
export async function chaseOverdueInvoices(now = new Date()): Promise<number> {
  const due = await targets(now);
  if (due.length === 0) {
    return 0;
  }
  const [addresses, profile] = await Promise.all([
    emailsByClient(due.map((target) => target.clientId)),
    companyProfile(),
  ]);

  let sent = 0;
  for (const target of due) {
    const to = addresses.get(target.clientId);
    if (!to) {
      continue;
    }
    const claimed = await claimReminder(
      RECEIVABLES_SOURCE,
      `invoice-dunning:${target.id}:${target.stage}`,
      1,
    );
    if (claimed && (await sendChase(target, to, profile.locale))) {
      sent += 1;
    }
  }
  return sent;
}
