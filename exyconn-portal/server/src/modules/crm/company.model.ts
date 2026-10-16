import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { companyProfileFields } from './crm.profile';
import { companyGeoFields } from './crm.geo';

/** Roughly how big the account is, for segmenting the book of business. */
export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'] as const;

/** Where the account stands with us, independent of any one deal. */
export const COMPANY_STATUSES = ['PROSPECT', 'CUSTOMER', 'PARTNER', 'CHURNED'] as const;

/**
 * An account: the organisation deals and contacts hang off. `domain` is the
 * natural key sales people recognise, so it is unique — two rows for the same
 * company is the failure mode that makes a CRM untrustworthy.
 */
const companySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    industry: { type: String, default: '', trim: true },
    size: { type: String, enum: COMPANY_SIZES, required: true, default: '1-10' },
    status: { type: String, enum: COMPANY_STATUSES, required: true, default: 'PROSPECT' },
    phone: { type: String, default: '', trim: true },
    location: { type: String, default: '', trim: true },
    owner: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    /** The Admin client this account became when a deal was won; empty until then. */
    clientId: { type: String, default: '', trim: true },
    /** Values of the company's own properties (CRM > Settings > Properties), keyed by property. */
    custom: { type: Schema.Types.Mixed, default: {} },
    ...companyProfileFields,
    ...companyGeoFields,
  },
  { timestamps: true },
);

export type CompanyDocument = InferSchemaType<typeof companySchema>;
export const CompanyModel: Model<CompanyDocument> = model<CompanyDocument>(
  'Company',
  companySchema,
);
