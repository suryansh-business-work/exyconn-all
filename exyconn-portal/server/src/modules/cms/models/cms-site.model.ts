import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const CMS_SITE_STATUSES = ['ACTIVE', 'DRAFT'] as const;

/**
 * A website the CMS serves (Website › Websites): its domains, design system, header and footer,
 * and what goes into every page's head and body. exyconn.com is the first; others are added in
 * the portal. Exactly one is the default — the site any unknown host (localhost) is served as.
 * Platform-wide: Exyconn's own web presence, not a customer company's data.
 */
const cmsSiteSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    /** Host names the site answers on, lower-case, without scheme or port. */
    domains: { type: [String], default: [] },
    isDefault: { type: Boolean, required: true, default: false },
    status: { type: String, enum: CMS_SITE_STATUSES, required: true, default: 'DRAFT' },
    /** Pages are served under a market prefix (/en-us/…) with alternates for every market. */
    markets: { type: Boolean, required: true, default: false },
    defaultLocale: { type: String, required: true, trim: true, default: 'en' },
    faviconUrl: { type: String, default: '', trim: true },
    seo: {
      titleTemplate: { type: String, default: '%s', trim: true },
      description: { type: String, default: '', trim: true },
      ogImageUrl: { type: String, default: '', trim: true },
    },
    headerFragmentId: { type: String, default: '' },
    footerFragmentId: { type: String, default: '' },
    designSystemId: { type: String, default: '' },
    /** Markup added to every page's <head> (meta tags, analytics). */
    headHtml: { type: String, default: '' },
    /** Markup added before every page's </body> (scripts). */
    bodyEndHtml: { type: String, default: '' },
    globalCss: { type: String, default: '' },
    notFoundPageId: { type: String, default: '' },
    /** Seed items already inserted (see cms.seed.ts): never inserted twice, even if deleted. */
    seededKeys: { type: [String], default: [] },
  },
  { timestamps: true },
);

cmsSiteSchema.index({ domains: 1 });

export type CmsSiteDocument = InferSchemaType<typeof cmsSiteSchema>;

export const CmsSiteModel: Model<CmsSiteDocument> = model<CmsSiteDocument>(
  'CmsSite',
  cmsSiteSchema,
);
