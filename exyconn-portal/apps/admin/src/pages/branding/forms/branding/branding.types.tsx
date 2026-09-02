import { z } from 'zod';
import type { BrandingQuery } from '@exyconn/shell/graphql/generated';

/** The branding record as returned by the codegen'd `Branding` query. */
export type BrandingRow = BrandingQuery['branding'];

const text = z.string().trim();
/** Optional URL — the API stores an empty string when a field is unset. */
const url = z.string().trim().url('Enter a valid URL').or(z.literal(''));
const email = z.string().trim().email('Enter a valid email address').or(z.literal(''));
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex colour, e.g. #155dfc');

export const brandingSchema = z.object({
  businessName: z.string().trim().min(1, 'Business name is required'),
  legalName: text,
  slogan: text,
  description: text,

  logoUrl: url,
  logoDarkUrl: url,
  faviconUrl: url,
  appIconUrl: url,
  emailLogoUrl: url,
  ogImageUrl: url,

  primaryColor: color,
  secondaryColor: color,
  accentColor: color,
  backgroundColor: color,
  textColor: color,

  supportEmail: email,
  contactPhone: text,
  websiteUrl: url,
  address: text,

  linkedinUrl: url,
  twitterUrl: url,
  facebookUrl: url,
  instagramUrl: url,
  youtubeUrl: url,
  githubUrl: url,

  copyrightText: text,
});

export type BrandingFormValues = z.infer<typeof brandingSchema>;

/** Maps the loaded record onto form values (drops `id`/`__typename`). */
export const toBrandingValues = (row: BrandingRow): BrandingFormValues => ({
  businessName: row.businessName,
  legalName: row.legalName,
  slogan: row.slogan,
  description: row.description,

  logoUrl: row.logoUrl,
  logoDarkUrl: row.logoDarkUrl,
  faviconUrl: row.faviconUrl,
  appIconUrl: row.appIconUrl,
  emailLogoUrl: row.emailLogoUrl,
  ogImageUrl: row.ogImageUrl,

  primaryColor: row.primaryColor,
  secondaryColor: row.secondaryColor,
  accentColor: row.accentColor,
  backgroundColor: row.backgroundColor,
  textColor: row.textColor,

  supportEmail: row.supportEmail,
  contactPhone: row.contactPhone,
  websiteUrl: row.websiteUrl,
  address: row.address,

  linkedinUrl: row.linkedinUrl,
  twitterUrl: row.twitterUrl,
  facebookUrl: row.facebookUrl,
  instagramUrl: row.instagramUrl,
  youtubeUrl: row.youtubeUrl,
  githubUrl: row.githubUrl,

  copyrightText: row.copyrightText,
});
