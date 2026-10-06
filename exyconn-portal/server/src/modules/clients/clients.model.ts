import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { TAX_ID_CODES } from './client-tax-id';

export const CLIENT_STATUSES = ['ACTIVE', 'INACTIVE', 'PROSPECT'] as const;

const clientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    /**
     * Not required: a client filed automatically when a deal is won carries whatever the
     * account had, and an account with no number on file is still somebody to invoice. The
     * clients form asks for one; the model must not refuse a win over it.
     */
    phone: { type: String, default: '', trim: true },
    company: { type: String, required: true, trim: true },
    status: { type: String, enum: CLIENT_STATUSES, required: true, default: 'PROSPECT' },
    /** ISO 3166-1 alpha-2: where the client is established, which decides their tax number. */
    country: { type: String, default: '', trim: true, uppercase: true },
    /** ISO 4217: the currency their invoices are raised in by default; '' for the company's. */
    currency: { type: String, default: '', trim: true, uppercase: true },
    /**
     * Their business tax registration, as an invoice to them prints it: the kind of number
     * (client-tax-id.ts — GSTIN, VAT, EIN, ABN…) and the number, spaces removed.
     */
    taxIdType: { type: String, enum: [...TAX_ID_CODES, ''], default: '' },
    taxId: { type: String, default: '', trim: true, uppercase: true },
    /**
     * The GSTIN, kept in step with taxId while the number is an Indian one so Indian invoice
     * code that reads it keeps working; '' otherwise.
     */
    gstin: { type: String, default: '', trim: true, uppercase: true },
    /** Two-digit GST state code (Indian clients only); the default place of supply. */
    stateCode: { type: String, default: '', trim: true },
    /** State, province or region (ISO 3166-2 subdivision name or code). */
    region: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    postalCode: { type: String, default: '', trim: true },
    billingAddress: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type ClientDocument = InferSchemaType<typeof clientSchema>;
export const ClientModel: Model<ClientDocument> = model<ClientDocument>('Client', clientSchema);
