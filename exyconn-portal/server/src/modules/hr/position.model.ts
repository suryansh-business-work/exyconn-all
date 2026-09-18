import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A job position inside a department, reused as the designation on employee records. The
 * salary band is monthly, in the company's own currency.
 */
const positionSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    /** The owning department's name. */
    department: { type: String, required: true, trim: true, index: true },
    code: { type: String, trim: true, uppercase: true, default: null },
    description: { type: String, trim: true, default: null },
    minSalary: { type: Number, min: 0, default: 0 },
    maxSalary: { type: Number, min: 0, default: 0 },
    /** Code of the Grade this position sits in. */
    grade: { type: String, trim: true, default: null },
    /** Code of the EmploymentType the position is hired on. */
    employmentType: { type: String, trim: true, default: null },
    /** Approved seats; the number of people who may hold the position at once. */
    headcount: { type: Number, min: 0, default: 1 },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export type PositionDocument = InferSchemaType<typeof positionSchema>;
export const PositionModel: Model<PositionDocument> = model<PositionDocument>(
  'Position',
  positionSchema,
);
