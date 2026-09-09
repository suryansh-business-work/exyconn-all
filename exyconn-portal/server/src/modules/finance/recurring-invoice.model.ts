import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * How often a retainer bills.
 *
 * Deliberately a small fixed list rather than a cron expression: a finance screen is not a
 * place to hand somebody a scheduling language they can get subtly wrong, and every real
 * retainer this business has is one of these four.
 */
export const RECURRENCE_FREQUENCIES = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] as const;

/** One billed line on a schedule. Identical to an invoice line — it becomes one verbatim. */
const recurringLineSchema = new Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    taxPercent: { type: Number, required: true, min: 0, default: 0 },
    hsnSac: { type: String, default: '', trim: true },
  },
  { _id: false },
);

/**
 * A standing instruction to raise the same invoice every period.
 *
 * It is NOT an invoice and never becomes one: it spawns them. Keeping the schedule separate
 * from what it produced is what lets a retainer's rate change next month without rewriting
 * the invoices already issued and paid under the old one.
 */
const recurringInvoiceSchema = new Schema(
  {
    /** What this retainer is called on the schedule screen — never printed on the invoice. */
    name: { type: String, required: true, trim: true },
    clientId: { type: String, required: true, trim: true },
    /** Denormalised on write, exactly as an invoice does, so the grid never joins to read it. */
    clientName: { type: String, default: '', trim: true },
    lines: { type: [recurringLineSchema], default: [] },
    currency: { type: String, required: true, default: 'INR', trim: true },
    placeOfSupplyStateCode: { type: String, default: '', trim: true },
    frequency: { type: String, enum: RECURRENCE_FREQUENCIES, required: true, default: 'MONTHLY' },
    /** The first issue date. `nextRunAt` starts here and walks forward one period at a time. */
    startDate: { type: Date, required: true },
    /**
     * When the next invoice is due to be raised.
     *
     * The single source of truth for the schedule — advanced only after an invoice has
     * actually been written, so a crash mid-generation repeats the period rather than
     * skipping it. A skipped month is money nobody ever bills.
     */
    nextRunAt: { type: Date, required: true },
    /** Stops after this date. Null runs until somebody pauses it. */
    endDate: { type: Date, default: null },
    /** Days between an invoice's issue date and its due date. */
    dueDays: { type: Number, required: true, min: 0, default: 30 },
    /**
     * Paused schedules keep their `nextRunAt` untouched, so resuming bills the period it was
     * paused in rather than silently forgiving it.
     */
    active: { type: Boolean, required: true, default: true },
    lastGeneratedAt: { type: Date, default: null },
    /** How many invoices this schedule has raised — the answer to "is this thing working". */
    generatedCount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];
export type RecurringInvoiceDocument = InferSchemaType<typeof recurringInvoiceSchema>;
export const RecurringInvoiceModel: Model<RecurringInvoiceDocument> =
  model<RecurringInvoiceDocument>('RecurringInvoice', recurringInvoiceSchema);
