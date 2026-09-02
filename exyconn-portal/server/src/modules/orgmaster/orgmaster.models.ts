import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** A physical office or work site. Employees and holidays can be scoped to one. */
const locationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    /** IANA zone, e.g. Asia/Kolkata — attendance and shifts are read in it. */
    timezone: { type: String, default: 'Asia/Kolkata' },
    address: { type: String, default: '' },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);
locationSchema.index({ code: 1 }, { unique: true });

/** A team inside a department, with an optional lead. */
const teamSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    department: { type: String, default: '' },
    leadEmployeeId: { type: String, default: null },
    description: { type: String, default: '' },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

/** A job grade / band, used for salary ranges and eligibility rules. */
const gradeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    /** Higher is more senior; drives ordering in reports. */
    level: { type: Number, required: true, min: 0, default: 1 },
    minSalary: { type: Number, required: true, min: 0, default: 0 },
    maxSalary: { type: Number, required: true, min: 0, default: 0 },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);
gradeSchema.index({ code: 1 }, { unique: true });

/** Full-time, contract, intern and so on. */
const employmentTypeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, default: '' },
    /** Whether people on this type accrue leave and appear in payroll. */
    payrollEligible: { type: Boolean, required: true, default: true },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);
employmentTypeSchema.index({ code: 1 }, { unique: true });

/** A working-hours pattern. Times are local "HH:mm" in the location's timezone. */
const shiftSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    startTime: { type: String, required: true, default: '09:30' },
    endTime: { type: String, required: true, default: '18:30' },
    breakMinutes: { type: Number, required: true, min: 0, default: 60 },
    /** Minutes after startTime before an arrival counts as late. */
    graceMinutes: { type: Number, required: true, min: 0, default: 15 },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);
shiftSchema.index({ code: 1 }, { unique: true });

export type LocationDocument = InferSchemaType<typeof locationSchema>;
export type TeamDocument = InferSchemaType<typeof teamSchema>;
export type GradeDocument = InferSchemaType<typeof gradeSchema>;
export type EmploymentTypeDocument = InferSchemaType<typeof employmentTypeSchema>;
export type ShiftDocument = InferSchemaType<typeof shiftSchema>;

export const LocationModel: Model<LocationDocument> = model<LocationDocument>(
  'Location',
  locationSchema,
);
export const TeamModel: Model<TeamDocument> = model<TeamDocument>('Team', teamSchema);
export const GradeModel: Model<GradeDocument> = model<GradeDocument>('Grade', gradeSchema);
export const EmploymentTypeModel: Model<EmploymentTypeDocument> = model<EmploymentTypeDocument>(
  'EmploymentType',
  employmentTypeSchema,
);
export const ShiftModel: Model<ShiftDocument> = model<ShiftDocument>('Shift', shiftSchema);
