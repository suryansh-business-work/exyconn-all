import { runAsPlatform } from '../../lib/tenant';
import { BrandingModel, type BrandingDocument } from './branding.model';
import { BRANDING_DEFAULTS } from './branding.constants';
import { LOGIN_PAGE_DEFAULTS, type LoginPageConfig } from './login-pages.constants';

/** MongoDB's duplicate-key error. */
const DUPLICATE_KEY = 11_000;

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
  hrEmail?: string;
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
  gstin?: string;
  stateCode?: string;
  addressLine?: string;
  invoicePrefix?: string;
  defaultTaxPercent?: number;
  bankDetails?: string;
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

/**
 * Merges defaults underneath the stored values, so older documents still read whole. A stored
 * null counts as missing: the GraphQL fields are non-null, and a null there fails the query.
 */
function withDefaults(doc: BrandingLean): BrandingLean {
  const stored = Object.fromEntries(Object.entries(doc).filter(([, value]) => value !== null));
  const merged = { ...BRANDING_DEFAULTS, ...stored } as BrandingLean;
  return { ...merged, loginPages: withLoginPageDefaults(merged.loginPages) };
}

/**
 * Reads the single global branding document, creating it with defaults on first use.
 * An atomic upsert rather than find-then-create, so two readers on a fresh database — an
 * invoice number and the invoice it numbers are drawn side by side — cannot both insert.
 */
export async function getBranding(): Promise<BrandingLean> {
  try {
    const doc = await BrandingModel.findOneAndUpdate(
      { key: 'global' },
      { $setOnInsert: { key: 'global' } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
    return withDefaults(doc as BrandingLean);
  } catch (error) {
    // Two first readers raced and the other won: the row it inserted is the answer to both.
    if ((error as { code?: number }).code !== DUPLICATE_KEY) {
      throw error;
    }
    const doc = await BrandingModel.findOne({ key: 'global' }).lean();
    return withDefaults(doc as BrandingLean);
  }
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

/**
 * The branding a sign-in page shows, before anyone has said which company they are in.
 *
 * Read across the platform because there is no company in scope yet: the first organization's
 * branding is what a visitor sees. Phase 2 resolves it from the address the page was opened
 * on, which is what lets two companies show their own logo on their own sign-in screen.
 */
export async function getPublicBranding(): Promise<BrandingLean> {
  const doc = await runAsPlatform(() =>
    BrandingModel.findOne({ key: 'global' }).sort({ createdAt: 1 }).lean(),
  );
  return withDefaults((doc ?? {}) as BrandingLean);
}
