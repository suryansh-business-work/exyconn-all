import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Daily attendance statuses an employee can record manually. */
export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'WFH', 'HALF_DAY'] as const;

/**
 * One attendance record per employee per calendar day. The unique
 * `{ employeeId, date }` index makes "mark attendance" an idempotent upsert.
 */
const attendanceSchema = new Schema(
  {
    employeeId: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ATTENDANCE_STATUSES, required: true, default: 'PRESENT' },
    note: { type: String, trim: true, default: null },
  },
  { timestamps: true },
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export type AttendanceDocument = InferSchemaType<typeof attendanceSchema>;

export const AttendanceModel: Model<AttendanceDocument> = model<AttendanceDocument>(
  'Attendance',
  attendanceSchema,
);
