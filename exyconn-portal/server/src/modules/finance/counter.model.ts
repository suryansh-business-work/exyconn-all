import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A named sequence. One row per series — `invoice` today — bumped atomically with `$inc`
 * so two invoices created in the same instant can never draw the same number.
 */
const counterSchema = new Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, required: true, default: 0 },
});

export type CounterDocument = InferSchemaType<typeof counterSchema>;
export const CounterModel: Model<CounterDocument> = model<CounterDocument>(
  'Counter',
  counterSchema,
);
