import { InvoiceModel, type InvoiceStatus } from './finance.model';
import { PaymentModel } from './payment.model';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { withId, withIds } from '../../utils/serialize';
import { badRequest, notFound } from '../../utils/errors';
import { tableQuery, type TableConfig, type TableQueryInput } from '../../utils/tableQuery';
import type { GraphQLContext } from '../../middleware/auth';

const financeRoles = [ROLES.FINANCE];

interface PaymentInput {
  invoiceId: string;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
  receivedAt?: Date;
}

/** Statuses that mean money is expected. A draft is not owed; a paid one is settled. */
const OWED_STATUSES = ['SENT', 'PARTIALLY_PAID', 'OVERDUE'];

/** Payments are written by `recordPayment`, so the ledger is read-only here. */
const PAYMENT_TABLE: TableConfig = {
  searchFields: ['invoiceNumber', 'clientId', 'reference'],
  filterFields: ['invoiceNumber', 'clientId', 'method'],
  sortFields: ['invoiceNumber', 'amount', 'method', 'receivedAt', 'createdAt'],
  defaultSort: { field: 'receivedAt', dir: 'DESC' },
};

/**
 * Money to two places.
 *
 * Amounts are floats, and 0.1 + 0.2 is famously not 0.3 — without this, paying an invoice
 * off in instalments leaves a balance of 1.4210854715202004e-14 owing, and the invoice
 * never reads as paid.
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** What is still owed. `amountPaid` is absent on invoices written before payments existed. */
function balanceOf(invoice: { amount: number; amountPaid?: number | null }): number {
  return round2(invoice.amount - (invoice.amountPaid ?? 0));
}

/**
 * Where a payment leaves the invoice.
 *
 * Only the money-driven statuses are decided here. DRAFT and SENT are a person's decision
 * about whether the invoice has gone out, and receiving money against a draft does not
 * un-draft it — so a settled draft is left alone rather than silently marked SENT.
 */
export function settleStatus(
  current: InvoiceStatus,
  amount: number,
  amountPaid: number,
): InvoiceStatus {
  if (amountPaid >= amount) {
    return 'PAID';
  }
  if (amountPaid > 0) {
    return 'PARTIALLY_PAID';
  }
  // Back to nothing paid (a refund reversed the only payment): whatever it was before the
  // money arrived, which is SENT for anything that had gone out.
  return current === 'DRAFT' ? 'DRAFT' : 'SENT';
}

/**
 * Records a receipt and moves the invoice's paid figure and status with it.
 *
 * The paid figure is written from the ledger rather than typed by hand, so "why does this
 * say paid?" is always answerable by the rows behind it — the same contract the stock
 * ledger keeps with a product's stock level.
 */
async function recordPayment(_p: unknown, { input }: { input: PaymentInput }, ctx: GraphQLContext) {
  assertRole(ctx, financeRoles);

  if (input.amount === 0) {
    badRequest('A payment of zero records nothing. Enter an amount, or a negative for a refund.');
  }

  const invoice = await InvoiceModel.findById(input.invoiceId);
  if (!invoice) {
    notFound('Invoice');
  }

  const paidBefore = invoice.amountPaid ?? 0;
  const paidAfter = round2(paidBefore + input.amount);

  if (paidAfter > invoice.amount) {
    badRequest(
      `That would pay ${paidAfter} against an invoice of ${invoice.amount}. ` +
        `Only ${balanceOf(invoice)} is outstanding.`,
    );
  }
  if (paidAfter < 0) {
    badRequest(`That would refund more than was ever paid on ${invoice.number}.`);
  }

  const payment = await PaymentModel.create({
    invoiceId: String(invoice._id),
    invoiceNumber: invoice.number,
    clientId: invoice.clientId,
    amount: round2(input.amount),
    currency: invoice.currency,
    method: input.method,
    reference: input.reference ?? '',
    notes: input.notes ?? '',
    receivedAt: input.receivedAt ?? new Date(),
    recordedBy: ctx.user?.email ?? '',
  });

  invoice.amountPaid = paidAfter;
  invoice.status = settleStatus(invoice.status, invoice.amount, paidAfter);
  await invoice.save();

  return withId(payment.toObject());
}

/** One age band of the receivables report. */
interface Band {
  band: string;
  label: string;
  /** Highest lateness, in days, that falls in this band. `null` means "everything older". */
  upTo: number | null;
}

/**
 * Age bands, in the order a finance team reads them: what is not yet late, then how late
 * the rest is. The 30-day steps are the convention every ageing report uses.
 */
const BANDS: readonly Band[] = [
  { band: 'CURRENT', label: 'Not yet due', upTo: 0 },
  { band: 'D1_30', label: '1–30 days', upTo: 30 },
  { band: 'D31_60', label: '31–60 days', upTo: 60 },
  { band: 'D60_PLUS', label: '60+ days', upTo: null },
];

const DAY_MS = 86_400_000;

/** Whole days past the due date; zero or less means it is not late yet. */
export function daysLate(dueDate: Date, now: Date): number {
  return Math.floor((now.getTime() - dueDate.getTime()) / DAY_MS);
}

/** The band a given lateness falls in. */
export function bandFor(late: number): string {
  const match = BANDS.find((b) => b.upTo !== null && late <= b.upTo);
  return match?.band ?? 'D60_PLUS';
}

/**
 * What is owed, and how late it is.
 *
 * Lateness is derived from the due date every time it is asked for, never stored: a stored
 * "overdue" flag is only as true as the last job that wrote it, and an ageing report that
 * is a day stale is worse than none.
 */
async function receivables(_p: unknown, _a: unknown, ctx: GraphQLContext) {
  assertRole(ctx, financeRoles);

  const open = await InvoiceModel.find({ status: { $in: OWED_STATUSES } })
    .select('amount amountPaid dueDate')
    .lean();

  const now = new Date();
  const totals = new Map(BANDS.map((b) => [b.band, { invoices: 0, amount: 0 }]));
  let outstanding = 0;
  let overdue = 0;
  let invoices = 0;

  for (const invoice of open) {
    const balance = balanceOf(invoice);
    if (balance <= 0) {
      continue;
    }
    const late = daysLate(invoice.dueDate, now);
    const bucket = totals.get(bandFor(late));
    if (bucket) {
      bucket.invoices += 1;
      bucket.amount = round2(bucket.amount + balance);
    }
    outstanding = round2(outstanding + balance);
    invoices += 1;
    if (late > 0) {
      overdue = round2(overdue + balance);
    }
  }

  return {
    outstanding,
    overdue,
    invoices,
    buckets: BANDS.map((b) => ({
      band: b.band,
      label: b.label,
      invoices: totals.get(b.band)?.invoices ?? 0,
      amount: totals.get(b.band)?.amount ?? 0,
    })),
  };
}

export const financeBillingResolvers = {
  /**
   * Both fields are computed rather than selected. `amountPaid` is stored, but invoices
   * written before payments existed come back without it — and a `.lean()` read applies no
   * schema default, so a non-nullable Float would blow up on every one of them.
   */
  Invoice: {
    amountPaid: (invoice: { amountPaid?: number | null }) => invoice.amountPaid ?? 0,
    balanceDue: (invoice: { amount: number; amountPaid?: number | null }) => balanceOf(invoice),
  },

  Query: {
    listPayments: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, financeRoles);
      return withIds(await PaymentModel.find().sort({ receivedAt: -1 }).lean());
    },
    listPaymentsPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, financeRoles);
      const page = await tableQuery(PaymentModel, input, PAYMENT_TABLE);
      return { rows: withIds(page.rows as Array<{ _id: unknown }>), totalCount: page.totalCount };
    },
    listPaymentsStats: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, financeRoles);
      const buckets = await PaymentModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$method', count: { $sum: 1 } } },
      ]);
      const [received] = await PaymentModel.aggregate<{ total: number }>([
        { $group: { _id: null, total: { $sum: '$amount' } } },
        { $project: { _id: 0 } },
      ]);
      return {
        total: await PaymentModel.countDocuments(),
        counts: [
          { field: 'method', buckets: buckets.map((b) => ({ value: b._id, count: b.count })) },
        ],
        sums: [{ field: 'amount', total: round2(received?.total ?? 0) }],
      };
    },
    invoicePayments: async (
      _p: unknown,
      { invoiceId }: { invoiceId: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, financeRoles);
      return withIds(await PaymentModel.find({ invoiceId }).sort({ receivedAt: -1 }).lean());
    },
    receivables,
  },

  Mutation: {
    recordPayment,
  },
};

export { financeBillingTypeDefs } from './finance.billing.typeDefs';
