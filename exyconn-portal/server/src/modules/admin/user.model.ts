import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { ALL_ROLES, ROLES } from '../../constants/roles';
import {
  DEFAULT_WORK_HOURS_PER_DAY,
  WORKING_TIMES,
  WORK_HOURS_MAX,
  WORK_HOURS_MIN,
  WORK_LOCATIONS,
} from '../../constants/work';

/** Employment (HR) status, distinct from account access (isActive/isBlocked). */
export const EMPLOYMENT_STATUSES = ['ACTIVE', 'ON_LEAVE', 'TERMINATED'] as const;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    roles: {
      type: [String],
      enum: ALL_ROLES,
      required: true,
      default: [ROLES.EMPLOYEE],
    },
    avatarUrl: { type: String, default: null },
    isActive: { type: Boolean, required: true, default: true },
    isBlocked: { type: Boolean, required: true, default: false },
    blockReason: { type: String, default: null },
    // HR fields — optional so legacy accounts (e.g. seed admin) stay valid.
    department: { type: String, trim: true, default: null },
    designation: { type: String, trim: true, default: null },
    joinDate: { type: Date, default: null },
    /** Used for birthday reminders; only the day and month are ever shown. */
    dateOfBirth: { type: Date, default: null },
    employmentStatus: {
      type: String,
      enum: EMPLOYMENT_STATUSES,
      required: true,
      default: 'ACTIVE',
    },
    /** Postal address, as given on the employment record. */
    address: { type: String, trim: true, default: null },
    /** A few lines about the person, shown on their profile across the portals. */
    brief: { type: String, trim: true, default: null },
    // Working arrangement — read by the tracker to measure a day, and by the employee
    // portal to show people their own terms. Defaults apply to accounts that predate them.
    workingTime: { type: String, enum: WORKING_TIMES, default: 'FLEXIBLE' },
    /** What "OTHER" means for this person; empty for the named arrangements. */
    workingTimeNote: { type: String, trim: true, default: null },
    workLocation: { type: String, enum: WORK_LOCATIONS, default: 'OFFICE' },
    workLocationNote: { type: String, trim: true, default: null },
    /**
     * The contracted working day, in hours. Every arrangement has one — flexible moves the
     * clock time, not the length of the day — so this is set regardless of `workingTime`.
     */
    workHoursPerDay: {
      type: Number,
      default: DEFAULT_WORK_HOURS_PER_DAY,
      min: WORK_HOURS_MIN,
      max: WORK_HOURS_MAX,
    },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const UserModel: Model<UserDocument> = model<UserDocument>('User', userSchema);
