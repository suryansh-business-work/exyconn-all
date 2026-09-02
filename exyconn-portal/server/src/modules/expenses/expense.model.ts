import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const EXPENSE_STATUSES = ['SUBMITTED', 'APPROVED', 'REJECTED', 'PAID'] as const;

const expenseSchema = new Schema(
  {
    employeeId: { type: String, required: true, index: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR' },
    incurredOn: { type: Date, required: true },
    /** Uploaded bill or invoice. */
    receiptUrl: { type: String, default: null },
    status: { type: String, enum: EXPENSE_STATUSES, required: true, default: 'SUBMITTED' },
    /** What finance actually cleared, which can differ from the claim. */
    approvedAmount: { type: Number, default: null, min: 0 },
  },
  { timestamps: true },
);

expenseSchema.index({ employeeId: 1, incurredOn: -1 });

export type ExpenseClaimDocument = InferSchemaType<typeof expenseSchema>;
export const ExpenseClaimModel: Model<ExpenseClaimDocument> = model<ExpenseClaimDocument>(
  'ExpenseClaim',
  expenseSchema,
);
