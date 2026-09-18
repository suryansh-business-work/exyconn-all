import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * An organizational department, managed by HR and reused on employee records. Its positions
 * live in their own collection and point back here by the department's name.
 */
const departmentSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    /** A short reference used on reports and exports, e.g. ENG. */
    code: { type: String, trim: true, uppercase: true, default: null },
    description: { type: String, trim: true, default: null },
    /** The employee who heads the department. */
    headId: { type: String, default: null },
  },
  { timestamps: true },
);

export type DepartmentDocument = InferSchemaType<typeof departmentSchema>;
export const DepartmentModel: Model<DepartmentDocument> = model<DepartmentDocument>(
  'Department',
  departmentSchema,
);
