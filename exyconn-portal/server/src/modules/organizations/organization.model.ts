import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** A suspended organization stays intact; nobody in it can sign in. */
export const ORGANIZATION_STATUSES = ['ACTIVE', 'SUSPENDED'] as const;

export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

/**
 * One company using the portal — the tenant every other record belongs to (see
 * lib/tenant). Created by the platform's own administrators, who then appoint the
 * company's first administrator; from there the company administers itself.
 *
 * Its defaults are the international ones every screen in that company reads: the country it
 * operates in (ISO 3166-1), the money it keeps books in (ISO 4217), the language it reads
 * (BCP 47) and the clock it works by (IANA). A person may still choose their own language
 * and timezone; these are what the company falls back to.
 */
const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    /** URL-safe handle, unique across the platform. */
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    legalName: { type: String, default: '', trim: true },
    status: { type: String, enum: ORGANIZATION_STATUSES, required: true, default: 'ACTIVE' },
    /** ISO 3166-1 alpha-2. */
    country: { type: String, default: '', uppercase: true, trim: true },
    /** ISO 4217. */
    currency: { type: String, required: true, uppercase: true, trim: true },
    /** BCP 47 language tag. */
    locale: { type: String, required: true, trim: true, default: 'en' },
    /** IANA timezone name. */
    timezone: { type: String, required: true, trim: true, default: 'UTC' },
    /** 1–12. April (4) in India, January (1) in much of the world. */
    fiscalYearStartMonth: { type: Number, required: true, default: 1, min: 1, max: 12 },
    contactEmail: { type: String, default: '', lowercase: true, trim: true },
  },
  { timestamps: true },
);

export type OrganizationDocument = InferSchemaType<typeof organizationSchema>;

export const OrganizationModel: Model<OrganizationDocument> = model<OrganizationDocument>(
  'Organization',
  organizationSchema,
);
