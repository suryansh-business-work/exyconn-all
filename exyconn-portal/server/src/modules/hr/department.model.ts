import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** An organizational department, managed by HR and reused on employee records. */
const departmentSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true, default: null },
  },
  { timestamps: true },
);

export type DepartmentDocument = InferSchemaType<typeof departmentSchema>;
export const DepartmentModel: Model<DepartmentDocument> = model<DepartmentDocument>(
  'Department',
  departmentSchema,
);
