import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * Single source of truth for the Exyconn brand, consumed by every surface: the public
 * website, the desktop tracker, the tools apps and transactional email. One document,
 * keyed `global` (same singleton pattern as AppSettings), edited from Admin > Branding.
 *
 * Every field has a default so a fresh install renders correctly, and so `.lean()` reads
 * of an older document never yield null for a non-nullable GraphQL field.
 */
const brandingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },

    // Identity
    businessName: { type: String, required: true, default: 'Exyconn', trim: true },
    legalName: { type: String, default: 'Exyconn Technologies', trim: true },
    slogan: { type: String, default: 'AI-Powered Business Solutions', trim: true },
    description: { type: String, default: '', trim: true },

    // Imagery (ImageKit URLs)
    logoUrl: { type: String, default: '', trim: true },
    logoDarkUrl: { type: String, default: '', trim: true },
    faviconUrl: { type: String, default: '', trim: true },
    appIconUrl: { type: String, default: '', trim: true },
    emailLogoUrl: { type: String, default: '', trim: true },
    ogImageUrl: { type: String, default: '', trim: true },

    // Palette
    primaryColor: { type: String, required: true, default: '#155dfc', trim: true },
    secondaryColor: { type: String, default: '#00d4ff', trim: true },
    accentColor: { type: String, default: '#f97316', trim: true },
    backgroundColor: { type: String, default: '#f4f6fb', trim: true },
    textColor: { type: String, default: '#0f172a', trim: true },

    // Contact
    supportEmail: { type: String, default: 'support@exyconn.com', trim: true },
    contactPhone: { type: String, default: '', trim: true },
    websiteUrl: { type: String, default: 'https://exyconn.com', trim: true },
    address: { type: String, default: '', trim: true },

    // Social
    linkedinUrl: { type: String, default: '', trim: true },
    twitterUrl: { type: String, default: '', trim: true },
    facebookUrl: { type: String, default: '', trim: true },
    instagramUrl: { type: String, default: '', trim: true },
    youtubeUrl: { type: String, default: '', trim: true },
    githubUrl: { type: String, default: '', trim: true },

    copyrightText: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type BrandingDocument = InferSchemaType<typeof brandingSchema>;
export const BrandingModel: Model<BrandingDocument> = model<BrandingDocument>(
  'Branding',
  brandingSchema,
);
