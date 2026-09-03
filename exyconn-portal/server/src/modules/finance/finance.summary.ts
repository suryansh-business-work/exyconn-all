import type { Model } from 'mongoose';
import { InvoiceModel } from './finance.model';
import { PaymentModel } from './payment.model';
import { CompanyExpenseModel, EXPENSE_CATEGORIES } from './company-expense.model';
import { SalarySlipModel } from '../employee/salarySlip.model';
import { ExpenseClaimModel } from '../expenses/expense.model';

/** Money to two places — see the note on round2 in finance.billing.ts. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Any model this summary adds up. The document shapes differ across modules and none of that
 * matters here — only that the collection can be aggregated over.
 */
type Aggregatable = Pick<Model<Record<string, unknown>>, 'aggregate'>;

/** Sums one numeric field over a match, returning 0 rather than undefined for an empty set. */
async function sumOf(
  model: Aggregatable,
  match: Record<string, unknown>,
  field: string,
): Promise<number> {
  const [result] = await model.aggregate<{ total: number }>([
    { $match: match },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
    { $project: { _id: 0 } },
  ]);
  return round2(result?.total ?? 0);
}

/** SCREAMING_SNAKE reads badly in a UI; the server sends the label it means. */
function humanise(value: string): string {
  const spaced = value.replaceAll('_', ' ').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Claims that have actually become a company cost. A rejected claim never was one. */
const COUNTED_CLAIM_STATUSES = ['APPROVED', 'PAID'];

/** Invoice statuses that mean money is still expected. */
const OWED_STATUSES = ['SENT', 'PARTIALLY_PAID', 'OVERDUE'];

export interface Period {
  from: Date;
  to: Date;
}

/** The accrual half: what the period earned, and what it cost, whenever the money moves. */
async function accrual(period: Period) {
  const window = { $gte: period.from, $lte: period.to };
  const [invoiced, expenses, payroll, reimbursements] = await Promise.all([
    sumOf(InvoiceModel, { issuedDate: window, status: { $ne: 'DRAFT' } }, 'amount'),
    sumOf(CompanyExpenseModel, { incurredOn: window }, 'amount'),
    sumOf(SalarySlipModel, { issuedDate: window }, 'net'),
    sumOf(
      ExpenseClaimModel,
      { incurredOn: window, status: { $in: COUNTED_CLAIM_STATUSES } },
      'amount',
    ),
  ]);

  const totalCost = round2(expenses + payroll + reimbursements);
  return {
    invoiced,
    expenses,
    payroll,
    reimbursements,
    totalCost,
    profit: round2(invoiced - totalCost),
  };
}

/** The cash half: what actually moved, whenever it was earned or incurred. */
async function cash(period: Period) {
  const window = { $gte: period.from, $lte: period.to };
  const [collected, paidOut] = await Promise.all([
    sumOf(PaymentModel, { receivedAt: window }, 'amount'),
    sumOf(CompanyExpenseModel, { paidOn: window, status: 'PAID' }, 'amount'),
  ]);
  return { collected, paidOut, netCash: round2(collected - paidOut) };
}

/**
 * What is owed in each direction RIGHT NOW.
 *
 * Deliberately not scoped to the period: an invoice raised last quarter and still unpaid is
 * money owed today, and a receivables figure that silently excluded it would be the most
 * dangerous number on the page.
 */
async function position(now: Date) {
  const open = await InvoiceModel.find({ status: { $in: OWED_STATUSES } })
    .select('amount amountPaid')
    .lean();
  const outstandingReceivable = round2(
    open.reduce((total, invoice) => total + (invoice.amount - (invoice.amountPaid ?? 0)), 0),
  );

  const unpaid = await CompanyExpenseModel.find({ status: 'UNPAID' })
    .select('amount dueDate')
    .lean();
  const outstandingPayable = round2(unpaid.reduce((total, bill) => total + bill.amount, 0));
  const overduePayable = round2(
    unpaid.filter((bill) => bill.dueDate < now).reduce((total, bill) => total + bill.amount, 0),
  );

  return { outstandingReceivable, outstandingPayable, overduePayable };
}

/** Spend by category, biggest first, with the empty categories left out. */
async function byCategory(period: Period) {
  const buckets = await CompanyExpenseModel.aggregate<{ _id: string; total: number }>([
    { $match: { incurredOn: { $gte: period.from, $lte: period.to } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
  ]);

  const found = new Map(buckets.map((bucket) => [bucket._id, bucket.total]));
  const slices = EXPENSE_CATEGORIES.filter((key) => (found.get(key) ?? 0) > 0).map((key) => ({
    key: String(key),
    label: humanise(key),
    amount: round2(found.get(key) ?? 0),
  }));
  // Biggest first: a spend breakdown is read to find where the money went, not alphabetically.
  slices.sort((a, b) => b.amount - a.amount);
  return slices;
}

/** `2026-09` for a date, in UTC — the key the monthly series is bucketed on. */
export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** `Sep 2026` for a `2026-09` key. */
export function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** Every month the period touches, in order, so a quiet month shows as a gap at zero. */
export function monthsBetween(from: Date, to: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  const last = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));
  while (cursor <= last) {
    keys.push(monthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys;
}

/** Groups a set of dated amounts into the month buckets the trend expects. */
function intoMonths(rows: Array<{ date: Date; amount: number }>): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = monthKey(row.date);
    totals.set(key, (totals.get(key) ?? 0) + row.amount);
  }
  return totals;
}

/**
 * The month-by-month trend, on the accrual figures — the same basis as `profit`, so the
 * chart and the headline number can never disagree.
 */
async function months(period: Period) {
  const window = { $gte: period.from, $lte: period.to };
  const [invoices, expenses, slips, claims] = await Promise.all([
    InvoiceModel.find({ issuedDate: window, status: { $ne: 'DRAFT' } })
      .select('issuedDate amount')
      .lean(),
    CompanyExpenseModel.find({ incurredOn: window }).select('incurredOn amount').lean(),
    SalarySlipModel.find({ issuedDate: window }).select('issuedDate net').lean(),
    ExpenseClaimModel.find({ incurredOn: window, status: { $in: COUNTED_CLAIM_STATUSES } })
      .select('incurredOn amount')
      .lean(),
  ]);

  const revenue = intoMonths(invoices.map((r) => ({ date: r.issuedDate, amount: r.amount })));
  const cost = intoMonths([
    ...expenses.map((r) => ({ date: r.incurredOn, amount: r.amount })),
    ...slips.map((r) => ({ date: r.issuedDate, amount: r.net })),
    ...claims.map((r) => ({ date: r.incurredOn, amount: r.amount })),
  ]);

  return monthsBetween(period.from, period.to).map((key) => {
    const earned = round2(revenue.get(key) ?? 0);
    const spent = round2(cost.get(key) ?? 0);
    return {
      month: key,
      label: monthLabel(key),
      revenue: earned,
      cost: spent,
      profit: round2(earned - spent),
    };
  });
}

/** The whole company picture for a period: accrual, cash, position, breakdown and trend. */
export async function companyFinance(period: Period, now: Date = new Date()) {
  const [accrued, moved, owed, categories, trend] = await Promise.all([
    accrual(period),
    cash(period),
    position(now),
    byCategory(period),
    months(period),
  ]);

  return {
    from: period.from,
    to: period.to,
    ...accrued,
    ...moved,
    ...owed,
    byCategory: categories,
    months: trend,
  };
}
