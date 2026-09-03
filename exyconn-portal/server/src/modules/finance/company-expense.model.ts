import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * What the money was spent on. Deliberately a short, fixed list: a free-text category field
 * turns into "Software", "software", "SaaS" and "Subscriptions" within a month, and a
 * spend-by-category breakdown built on that says nothing.
 */
export const EXPENSE_CATEGORIES = [
  'RENT',
  'SALARIES',
  'SOFTWARE',
  'HARDWARE',
  'SERVICES',
  'MARKETING',
  'TRAVEL',
  'UTILITIES',
  'TAXES',
  'OTHER',
] as const;

/** A bill is either still owed or settled. */
export const EXPENSE_STATES = ['UNPAID', 'PAID'] as const;

/**
 * A cost the COMPANY incurred — rent, software, a vendor invoice.
 *
 * Not to be confused with an ExpenseClaim, which is an employee asking to be reimbursed for
 * money they spent themselves. Both end up as company cost, and the finance summary counts
 * them separately so it can say which is which.
 *
 * `incurredOn` is when the cost was ACCRUED and `paidOn` is when the money actually left.
 * They are different dates and answer different questions — profit is built from the first,
 * cash flow from the second — so the model keeps both rather than collapsing them.
 */
const companyExpenseSchema = new Schema(
  {
    vendor: { type: String, required: true, trim: true },
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true, default: 'OTHER' },
    description: { type: String, default: '', trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR', trim: true },
    /** When the cost was incurred — the date profit is measured on. */
    incurredOn: { type: Date, required: true },
    /** When the bill falls due. Drives what the dashboard calls payable and overdue. */
    dueDate: { type: Date, required: true },
    status: { type: String, enum: EXPENSE_STATES, required: true, default: 'UNPAID' },
    /** When the money actually left — the date cash flow is measured on. Null until paid. */
    paidOn: { type: Date, default: null },
    reference: { type: String, default: '', trim: true },
    recordedBy: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type CompanyExpenseDocument = InferSchemaType<typeof companyExpenseSchema>;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CompanyExpenseModel: Model<CompanyExpenseDocument> = model<CompanyExpenseDocument>(
  'CompanyExpense',
  companyExpenseSchema,
);
