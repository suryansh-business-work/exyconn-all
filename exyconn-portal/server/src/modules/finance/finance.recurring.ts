import { RecurringInvoiceModel, type RecurringInvoiceDocument } from './recurring-invoice.model';
import { InvoiceModel } from './finance.model';
import { nextInvoiceNumber } from './invoice.number';
import { invoiceAmount, type InvoiceLineInput } from './invoice.lines';
import { dueDateFor, nextOccurrence } from './recurrence';
import { getBranding } from '../branding/branding.service';
import { clientNameFor } from '../clients';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';
import { badRequest, notFound } from '../../utils/errors';
import { assertPermission } from '../../lib/permissions';
import { logger } from '../../utils/logger';
import { JOB_KEYS, recordJobRun } from '../../utils/jobHeartbeat';
import type { GraphQLContext } from '../../middleware/auth';

/** How often the process asks whether a retainer is due. */
const TICK_MS = 60 * 60_000;

/** How many invoices one tick will raise in total before leaving the rest to the next. */
const MAX_PER_TICK = 20;

/**
 * How many periods one schedule may catch up in a single tick.
 *
 * Catching up is correct: a retainer three months behind means the business is owed three
 * months, and quietly forgiving two because a server was off is money nobody ever bills. But
 * a start date mistyped as 2019 would otherwise raise sixty invoices in one go, so the catch
 * up is bounded and the rest waits for the next tick — visible, and never a runaway.
 */
const MAX_CATCHUP_PER_SCHEDULE = 12;

interface RecurringInvoiceInput {
  name: string;
  clientId: string;
  clientName?: string;
  lines?: InvoiceLineInput[] | null;
  currency: string;
  placeOfSupplyStateCode?: string | null;
  frequency: string;
  startDate: Date;
  nextRunAt?: Date;
  endDate?: Date | null;
  dueDays: number;
  active?: boolean;
}

export const recurringInvoiceService = createCrudService<RecurringInvoiceInput>(
  RecurringInvoiceModel as never,
  'RecurringInvoice',
);

const crud = createCrudResolvers(recurringInvoiceService, {
  name: 'RecurringInvoice',
  roles: [ROLES.FINANCE],
  table: {
    searchFields: ['name', 'clientName'],
    filterFields: ['name', 'clientName', 'frequency', 'currency'],
    sortFields: ['name', 'clientName', 'frequency', 'nextRunAt', 'createdAt'],
    defaultSort: { field: 'nextRunAt', dir: 'ASC' },
  },
});

/**
 * What the form sends, made whole.
 *
 * `nextRunAt` is seeded from the start date on create, because a schedule with no next run
 * would never fire — and it is never taken from the form afterwards, since moving it by hand
 * is how a period gets billed twice or skipped entirely.
 */
async function completeInput(input: RecurringInvoiceInput): Promise<RecurringInvoiceInput> {
  if (!input.lines || input.lines.length === 0) {
    badRequest('Add at least one line — a retainer with nothing on it bills nothing.');
  }
  const clientName = await clientNameFor(input.clientId);
  return {
    ...input,
    clientName,
    lines: input.lines ?? [],
    placeOfSupplyStateCode: input.placeOfSupplyStateCode ?? '',
  };
}

const createRecurringInvoice = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { input } = args as unknown as { input: RecurringInvoiceInput };
  const completed = await completeInput(input);
  const seeded = { input: { ...completed, nextRunAt: completed.startDate } } as unknown as never;
  return crud.Mutation.createRecurringInvoice(p, seeded, ctx);
};

const updateRecurringInvoice = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { id, input } = args as unknown as { id: string; input: RecurringInvoiceInput };
  // `nextRunAt` is deliberately not editable: the schedule owns where it is up to.
  const completed = { id, input: await completeInput(input) } as unknown as never;
  return crud.Mutation.updateRecurringInvoice(p, completed, ctx);
};

/**
 * Writes ONE invoice for the period a claim has already been taken for.
 *
 * `issuedDate` is the schedule's `nextRunAt` AS IT WAS when the claim was won, not "now" — a
 * tick that runs late, or a server that was off over the weekend, must still date the invoice
 * to the period it bills.
 */
async function writeInvoice(schedule: RecurringInvoiceDocument, issuedDate: Date): Promise<string> {
  const lines = (schedule.lines ?? []) as InvoiceLineInput[];
  const [number, branding] = await Promise.all([nextInvoiceNumber(), getBranding()]);

  await InvoiceModel.create({
    number,
    clientId: schedule.clientId,
    clientName: schedule.clientName,
    lines,
    amount: invoiceAmount({ lines }) ?? 0,
    currency: schedule.currency,
    // Always a DRAFT: a machine may prepare an invoice, but a person sends it.
    status: 'DRAFT',
    issuedDate,
    dueDate: dueDateFor(issuedDate, schedule.dueDays),
    placeOfSupplyStateCode: schedule.placeOfSupplyStateCode ?? '',
    supplierStateCode: branding.stateCode,
  });
  return number;
}

/**
 * Claims one due schedule by MOVING IT ON, and hands back the period it claimed.
 *
 * This is a compare-and-set, and it has to be: the update matches on the exact `nextRunAt`
 * the read saw, so of two ticks racing — or two server processes — only one writes, and the
 * loser gets null and moves along. Stamping some other field would not do it, because the
 * `nextRunAt <= now` condition would still match for the second caller and the client would
 * be billed twice for one month.
 *
 * The schedule is advanced BEFORE the invoice exists, which is the deliberate direction of
 * this trade: a crash in between loses a draft (visible — `generatedCount` did not move, and
 * "Run now" replays it) where the other order risks billing a client twice, which is the
 * failure you find out about from the client.
 */
async function claimDue(
  now: Date,
  /** Schedules that have already caught up as far as one tick allows. */
  exhausted: string[] = [],
): Promise<{ id: string; schedule: RecurringInvoiceDocument; issuedDate: Date } | null> {
  const candidate = await RecurringInvoiceModel.findOne({
    active: true,
    nextRunAt: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $gte: now } }],
    ...(exhausted.length > 0 ? { _id: { $nin: exhausted } } : {}),
  }).sort({ nextRunAt: 1 });

  if (!candidate) {
    return null;
  }

  const issuedDate = new Date(candidate.nextRunAt);
  const claimed = await RecurringInvoiceModel.findOneAndUpdate(
    { _id: candidate._id, nextRunAt: candidate.nextRunAt },
    {
      nextRunAt: nextOccurrence(issuedDate, candidate.frequency as never),
      lastGeneratedAt: now,
      $inc: { generatedCount: 1 },
    },
    { new: true },
  );

  return claimed ? { id: String(candidate._id), schedule: claimed, issuedDate } : null;
}

/** Raises an invoice for every period every retainer is owed, bounded per tick. */
export async function generateDueInvoices(now: Date = new Date()): Promise<number> {
  let raised = 0;
  const perSchedule = new Map<string, number>();

  while (raised < MAX_PER_TICK) {
    const claim = await claimDue(
      now,
      [...perSchedule].filter(([, count]) => count >= MAX_CATCHUP_PER_SCHEDULE).map(([id]) => id),
    );
    if (!claim) {
      break;
    }
    perSchedule.set(claim.id, (perSchedule.get(claim.id) ?? 0) + 1);
    try {
      const number = await writeInvoice(claim.schedule, claim.issuedDate);
      raised += 1;
      logger.info(`Recurring invoice ${number} raised for "${claim.schedule.name}"`);
    } catch (error) {
      // The claim stands, so this period is not retried in a loop. It is a lost DRAFT, which
      // "Run now" replays — never a second invoice to a client.
      logger.error(error, `Recurring invoice for "${claim.schedule.name}" failed`);
    }
  }
  recordJobRun(JOB_KEYS.recurringInvoices, `${raised} invoice(s) raised`);
  return raised;
}

/** Raises this schedule's current period now, whatever its next run says. */
const runRecurringInvoiceNow = async (_p: unknown, args: never, ctx: GraphQLContext) => {
  const { id } = args as unknown as { id: string };
  await assertPermission(ctx, 'RecurringInvoice', [ROLES.FINANCE], 'CREATE');

  const schedule = await RecurringInvoiceModel.findById(id);
  if (!schedule) {
    notFound('Recurring invoice');
  }
  // Dates the invoice to the period the schedule is currently on, then moves it along — the
  // same order the unattended path uses, so pressing the button cannot double-bill either.
  const issuedDate = new Date(schedule.nextRunAt);
  await RecurringInvoiceModel.updateOne(
    { _id: schedule._id },
    {
      nextRunAt: nextOccurrence(issuedDate, schedule.frequency as never),
      lastGeneratedAt: new Date(),
      $inc: { generatedCount: 1 },
    },
  );
  await writeInvoice(schedule, issuedDate);
  return withIdOf(await RecurringInvoiceModel.findById(id).lean());
};

/** Mongo's `_id` as the `id` every GraphQL type here exposes. */
function withIdOf(row: unknown): unknown {
  const doc = row as { _id?: unknown } | null;
  return doc ? { ...doc, id: String(doc._id) } : null;
}

/** Starts the hourly check that raises invoices on the schedules finance set. */
export function startRecurringInvoiceSchedule(): void {
  const tick = () => {
    generateDueInvoices().catch((error: unknown) =>
      logger.error(error, 'Recurring invoice check failed'),
    );
  };
  tick();
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('Recurring invoice schedule started');
}

export const recurringInvoiceResolvers = {
  RecurringInvoice: {
    clientName: (row: { clientName?: string | null }) => row.clientName ?? '',
    lines: (row: { lines?: InvoiceLineInput[] | null }) => row.lines ?? [],
    placeOfSupplyStateCode: (row: { placeOfSupplyStateCode?: string | null }) =>
      row.placeOfSupplyStateCode ?? '',
    /** What the schedule bills each period — the same sum the invoice it writes will carry. */
    amount: (row: { lines?: InvoiceLineInput[] | null }) =>
      invoiceAmount({ lines: row.lines ?? [] }) ?? 0,
  },
  Query: { ...crud.Query },
  Mutation: {
    ...crud.Mutation,
    createRecurringInvoice,
    updateRecurringInvoice,
    runRecurringInvoiceNow,
  },
};
