import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * What one cost centre is allowed to spend in one month.
 *
 * Monthly, not "a period": every actual figure in this module is already bucketed by month
 * (`monthKey` in finance.summary.ts), so a budget with arbitrary bounds could not be
 * compared against them without apportioning it — and apportioning a budget is a guess
 * dressed as a number. A quarter is three rows.
 */
const budgetSchema = new Schema(
  {
    costCenterId: { type: String, required: true, index: true },
    /** `YYYY-MM`, matching monthKey, so budget and actual bucket identically. */
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR', trim: true },
    note: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

/** One budget per centre per month: two would mean the variance depends on which you read. */
budgetSchema.index({ costCenterId: 1, month: 1 }, { unique: true });

export type BudgetDocument = InferSchemaType<typeof budgetSchema>;
export const BudgetModel: Model<BudgetDocument> = model<BudgetDocument>('Budget', budgetSchema);
