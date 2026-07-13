import { BrandingModel, type BrandingDocument } from './branding.model';
import { BRANDING_DEFAULTS } from './branding.constants';

export interface BrandingInput {
  businessName?: string;
  legalName?: string;
  slogan?: string;
  description?: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  appIconUrl?: string;
  emailLogoUrl?: string;
  ogImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  supportEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  address?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  githubUrl?: string;
  copyrightText?: string;
}

export type BrandingLean = BrandingDocument & { _id: unknown };

/** Merges defaults underneath the stored values, so older documents still read whole. */
function withDefaults(doc: BrandingLean): BrandingLean {
  return { ...BRANDING_DEFAULTS, ...doc };
}

/** Reads the single global branding document, creating it with defaults on first use. */
export async function getBranding(): Promise<BrandingLean> {
  const existing = await BrandingModel.findOne({ key: 'global' }).lean();
  if (existing) {
    return withDefaults(existing as BrandingLean);
  }
  const created = await BrandingModel.create({ key: 'global' });
  return created.toObject() as BrandingLean;
}

/** Updates the global branding (ADMIN only). */
export async function updateBranding(input: BrandingInput): Promise<BrandingLean> {
  const updated = await BrandingModel.findOneAndUpdate({ key: 'global' }, input, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  }).lean();
  return withDefaults(updated as BrandingLean);
}
