import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const SIGN_IN_METHODS = [
  'EMAIL_PASSWORD',
  'GOOGLE',
  'GITHUB',
  'MICROSOFT',
  'APPLE',
  'SSO',
  'OTHER',
] as const;

export const PROVIDER_LINK_KINDS = [
  'DASHBOARD',
  'API_KEYS',
  'USAGE',
  'BILLING',
  'DOCS',
  'OTHER',
] as const;

/** One account the keys were created under: who signs in, and how. */
const loginSchema = new Schema({
  label: { type: String, required: true, trim: true },
  /** The email or username signed in with. */
  username: { type: String, default: '', trim: true },
  signInMethod: { type: String, enum: SIGN_IN_METHODS, default: 'EMAIL_PASSWORD' },
  /** Sealed (utils/secretBox). Empty for a Google/GitHub/SSO sign-in. */
  password: { type: String, default: '', select: false },
  passwordHint: { type: String, default: '' },
  notes: { type: String, default: '', trim: true },
});

const linkSchema = new Schema({
  label: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  kind: { type: String, enum: PROVIDER_LINK_KINDS, default: 'OTHER' },
});

/**
 * What Tech keeps about one provider beyond its keys: the accounts the keys were made under
 * and the team's own links (beside the built-in ones in provider-guides). One per provider
 * section; platform-wide, like the configs.
 */
const providerProfileSchema = new Schema(
  {
    provider: { type: String, required: true, unique: true, trim: true },
    logins: { type: [loginSchema], default: [] },
    links: { type: [linkSchema], default: [] },
  },
  { timestamps: true },
);

export type ProviderProfileDocument = InferSchemaType<typeof providerProfileSchema>;
export const ProviderProfileModel: Model<ProviderProfileDocument> = model<ProviderProfileDocument>(
  'TechProviderProfile',
  providerProfileSchema,
);
