import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The newest exchange rates from US dollars — every cost the platform records is in USD, and
 * Tech reads it in any currency. One row (`key` is fixed), replaced once a day. Install-wide.
 */
const fxRatesSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'USD' },
    /** The day the rates were published for, `YYYY-MM-DD`. */
    date: { type: String, required: true },
    /** Units of each currency one US dollar buys, by ISO 4217 code. */
    rates: { type: Map, of: Number, required: true, default: {} },
  },
  { timestamps: true },
);

export type FxRatesDocument = InferSchemaType<typeof fxRatesSchema>;

export const FxRatesModel: Model<FxRatesDocument> = model<FxRatesDocument>(
  'FxRates',
  fxRatesSchema,
);
