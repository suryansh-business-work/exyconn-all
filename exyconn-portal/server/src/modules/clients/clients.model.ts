import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const CLIENT_STATUSES = ['ACTIVE', 'INACTIVE', 'PROSPECT'] as const;

const clientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    status: { type: String, enum: CLIENT_STATUSES, required: true, default: 'PROSPECT' },
    // GST — what a tax invoice to this client prints about them.
    gstin: { type: String, default: '', trim: true, uppercase: true },
    /** Two-digit GST state code; the default place of supply on an invoice to them. */
    stateCode: { type: String, default: '', trim: true },
    billingAddress: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type ClientDocument = InferSchemaType<typeof clientSchema>;
export const ClientModel: Model<ClientDocument> = model<ClientDocument>('Client', clientSchema);
