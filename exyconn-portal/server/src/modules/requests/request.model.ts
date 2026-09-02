import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const REQUEST_TYPES = [
  'WFH',
  'REGULARIZATION',
  'DOCUMENT',
  'PROFILE_CHANGE',
  'REIMBURSEMENT',
  'TRAVEL',
  'OTHER',
] as const;
export const REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

const requestSchema = new Schema(
  {
    employeeId: { type: String, required: true, index: true },
    type: { type: String, enum: REQUEST_TYPES, required: true },
    subject: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true },
    status: { type: String, enum: REQUEST_STATUSES, required: true, default: 'PENDING' },
    decisionNote: { type: String, default: null },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

requestSchema.index({ employeeId: 1, createdAt: -1 });

export type EmployeeRequestDocument = InferSchemaType<typeof requestSchema>;
export const EmployeeRequestModel: Model<EmployeeRequestDocument> = model<EmployeeRequestDocument>(
  'EmployeeRequest',
  requestSchema,
);
