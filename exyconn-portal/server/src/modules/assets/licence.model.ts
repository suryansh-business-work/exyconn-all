import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** How often the licence is paid for, which is what makes its cost comparable. */
export const LICENCE_BILLING_CYCLES = ['MONTHLY', 'QUARTERLY', 'YEARLY'] as const;

/** Whether the subscription is still being paid for. */
export const LICENCE_STATUSES = ['ACTIVE', 'CANCELLED'] as const;

/**
 * One software subscription IT pays for.
 *
 * Deliberately not an {@link AssetModel} row with category SOFTWARE_LICENCE: an asset is
 * one physical thing held by one person, while a licence is a pot of seats that renews on
 * a date and costs money every cycle. Those are the three questions asked of it — who is
 * using it, when does it renew, what does it cost — and none of them fit the asset shape.
 *
 * Seats are held as employee ids only. Denormalising the names would go stale the first
 * time somebody's name changed, and the register already has a picker that resolves them.
 */
const licenceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    vendor: { type: String, required: true, trim: true },
    seatsTotal: { type: Number, required: true, min: 1 },
    /** Employees holding a seat. Its length is the seats used. */
    assigneeIds: { type: [String], default: [] },
    cost: { type: Number, required: true, min: 0 },
    billingCycle: {
      type: String,
      enum: LICENCE_BILLING_CYCLES,
      required: true,
      default: 'YEARLY',
    },
    renewalDate: { type: Date, required: true },
    status: { type: String, enum: LICENCE_STATUSES, required: true, default: 'ACTIVE' },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

export type LicenceDocument = InferSchemaType<typeof licenceSchema>;
export const LicenceModel: Model<LicenceDocument> = model<LicenceDocument>(
  'Licence',
  licenceSchema,
);
