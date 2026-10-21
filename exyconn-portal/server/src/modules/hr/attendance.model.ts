import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Daily attendance statuses an employee can record manually. */
export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'WFH', 'HALF_DAY'] as const;

/**
 * How a tracker mark-in was placed when the device could not read a fix: at the address HR
 * keeps on the employee's record, or nowhere at all. Null on a mark with a pin, or from HR.
 */
export const ATTENDANCE_LOCATION_FALLBACKS = ['PROFILE_ADDRESS', 'NONE'] as const;
export type AttendanceLocationFallback = (typeof ATTENDANCE_LOCATION_FALLBACKS)[number];

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
    locationFallback: { type: String, enum: ATTENDANCE_LOCATION_FALLBACKS, default: null },
    /** The profile address as it read when the employee marked in with it. */
    manualLocation: { type: String, trim: true, default: null },
  },
  { timestamps: true },
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export type AttendanceDocument = InferSchemaType<typeof attendanceSchema>;

export const AttendanceModel: Model<AttendanceDocument> = model<AttendanceDocument>(
  'Attendance',
  attendanceSchema,
);
