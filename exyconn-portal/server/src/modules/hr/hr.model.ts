import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const LEAVE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

const leaveRequestSchema = new Schema(
  {
    employeeId: { type: String, required: true, trim: true },
    /** The code of one of HR's leave types (LeavePolicy.code). */
    type: { type: String, required: true, trim: true, uppercase: true },
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
