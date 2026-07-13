import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** A job position/designation, managed by HR and reused on employee records. */
const positionSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    department: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: null },
  },
  { timestamps: true },
);

export type PositionDocument = InferSchemaType<typeof positionSchema>;
export const PositionModel: Model<PositionDocument> = model<PositionDocument>(
  'Position',
  positionSchema,
);
