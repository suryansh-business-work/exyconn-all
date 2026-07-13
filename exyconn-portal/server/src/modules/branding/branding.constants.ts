/**
 * Fallback brand values. These are merged UNDER a stored branding document on read, so a
 * document written before a field existed still reads whole — Mongoose only applies schema
 * defaults at creation and `.lean()` skips them entirely, which otherwise resolves a
 * non-nullable GraphQL field to null.
 */
export const BRANDING_DEFAULTS = Object.freeze({
  businessName: 'Exyconn',
  legalName: 'Exyconn Technologies',
  slogan: 'AI-Powered Business Solutions',
  description: '',

  logoUrl: '',
  logoDarkUrl: '',
  faviconUrl: '',
  appIconUrl: '',
  emailLogoUrl: '',
  ogImageUrl: '',

  primaryColor: '#155dfc',
  secondaryColor: '#00d4ff',
  accentColor: '#f97316',
  backgroundColor: '#f4f6fb',
  textColor: '#0f172a',

  supportEmail: 'support@exyconn.com',
  contactPhone: '',
  websiteUrl: 'https://exyconn.com',
  address: '',

  linkedinUrl: '',
  twitterUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  githubUrl: '',

  copyrightText: '',
});
