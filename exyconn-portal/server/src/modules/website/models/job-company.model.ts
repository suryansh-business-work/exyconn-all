import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const companyBenefitSchema = new Schema(
  {
    icon: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
  },
  { _id: false },
);

const socialLinksSchema = new Schema(
  {
    linkedin: { type: String, default: '', trim: true },
    twitter: { type: String, default: '', trim: true },
    facebook: { type: String, default: '', trim: true },
    instagram: { type: String, default: '', trim: true },
  },
  { _id: false },
);

const jobCompanySchema = new Schema(
  {
    /** Stable business key from the website data, e.g. "exyconn-group". */
    companyCode: { type: String, required: true, unique: true, trim: true },
    /** URL segment used by /career/company/[companySlug]. */
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    logo: { type: String, default: '', trim: true },
    tagline: { type: String, default: '', trim: true },
    /** Rich-text company description (HTML). */
    description: { type: String, default: '' },
    /** Rich-text culture section (HTML). */
    culture: { type: String, default: '' },
    website: { type: String, default: '', trim: true },
    founded: { type: String, default: '', trim: true },
    employees: { type: String, default: '', trim: true },
    industry: { type: String, default: '', trim: true },
    headquarters: { type: String, default: '', trim: true },
    benefits: { type: [companyBenefitSchema], default: [] },
    socialLinks: { type: socialLinksSchema, default: () => ({}) },
    brandColor: { type: String, default: '#0071e3', trim: true },
    secondaryColor: { type: String, default: '#00d4ff', trim: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type JobCompanyDocument = InferSchemaType<typeof jobCompanySchema>;
export const JobCompanyModel: Model<JobCompanyDocument> = model<JobCompanyDocument>(
  'JobCompany',
  jobCompanySchema,
);
