import { BrandingModel, type BrandingDocument } from './branding.model';
import { BRANDING_DEFAULTS } from './branding.constants';
import { LOGIN_PAGE_DEFAULTS, type LoginPageConfig } from './login-pages.constants';

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
  loginPages?: LoginPageConfig[];
}

/**
 * A `.lean()` read of the branding document. `loginPages` is restated as a plain array —
 * lean strips Mongoose's DocumentArray wrapper, and the resolver hands the result straight
 * to GraphQL.
 */
export type BrandingLean = Omit<BrandingDocument, 'loginPages'> & {
  _id: unknown;
  loginPages: LoginPageConfig[];
};

/**
 * One entry per known portal app, in registry order: the stored configuration when the
 * admin has edited that app, the shipped default otherwise. Keeping the list complete
 * here means a newly added portal renders a login screen before anyone touches Branding.
 */
function withLoginPageDefaults(stored: LoginPageConfig[] | undefined): LoginPageConfig[] {
  const byApp = new Map((stored ?? []).map((page) => [page.app, page]));
  return LOGIN_PAGE_DEFAULTS.map((fallback) => ({ ...fallback, ...byApp.get(fallback.app) }));
}

/** Merges defaults underneath the stored values, so older documents still read whole. */
function withDefaults(doc: BrandingLean): BrandingLean {
  const merged = { ...BRANDING_DEFAULTS, ...doc } as BrandingLean;
  return { ...merged, loginPages: withLoginPageDefaults(merged.loginPages) };
}

/** Reads the single global branding document, creating it with defaults on first use. */
export async function getBranding(): Promise<BrandingLean> {
  const existing = await BrandingModel.findOne({ key: 'global' }).lean();
  if (existing) {
    return withDefaults(existing as BrandingLean);
  }
  const created = await BrandingModel.create({ key: 'global' });
  return withDefaults(created.toObject() as BrandingLean);
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
