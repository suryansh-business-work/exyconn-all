import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const LEAVE_TYPES = ['CASUAL', 'SICK', 'EARNED', 'UNPAID'] as const;
export const LEAVE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

const leaveRequestSchema = new Schema(
  {
    employeeId: { type: String, required: true, trim: true },
    type: { type: String, enum: LEAVE_TYPES, required: true, default: 'CASUAL' },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: LEAVE_STATUSES, required: true, default: 'PENDING' },
  },
  { timestamps: true },
);

export type LeaveRequestDocument = InferSchemaType<typeof leaveRequestSchema>;
export const LeaveRequestModel: Model<LeaveRequestDocument> = model<LeaveRequestDocument>(
  'LeaveRequest',
  leaveRequestSchema,
);
