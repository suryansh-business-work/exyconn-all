import type { BrandingRow } from '../../../../src/pages/branding/forms/branding';

/** No image set: the API stores an empty string for an unset URL. */
const NO_IMAGES = {
  logoUrl: '',
  logoDarkUrl: '',
  faviconUrl: '',
  appIconUrl: '',
  emailLogoUrl: '',
  ogImageUrl: '',
  heroVideoUrl: '',
  heroPosterUrl: '',
  faviconDarkUrl: '',
  appIconDarkUrl: '',
  emailLogoDarkUrl: '',
  ogImageDarkUrl: '',
  heroVideoDarkUrl: '',
  heroPosterDarkUrl: '',
};

/** No social profile set. */
const NO_SOCIALS = {
  linkedinUrl: '',
  twitterUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  githubUrl: '',
  clutchUrl: '',
  crunchbaseUrl: '',
  ambitionboxUrl: '',
};

/** The branding record as the `Branding` query returns it. */
export const branding = (overrides: Partial<BrandingRow> = {}): BrandingRow => ({
  __typename: 'Branding',
  id: 'global',
  businessName: 'Acme',
  legalName: 'Acme Industries Pvt Ltd',
  slogan: 'Built to last',
  description: '',
  ...NO_IMAGES,
  primaryColor: '#155dfc',
  secondaryColor: '#22d3ee',
  accentColor: '#ea580c',
  backgroundColor: '#fafafa',
  textColor: '#020617',
  supportEmail: 'support@acme.example',
  hrEmail: '',
  contactPhone: '',
  websiteUrl: 'https://acme.example',
  address: '',
  ...NO_SOCIALS,
  copyrightText: '',
  gstin: '',
  stateCode: '',
  addressLine: '',
  invoicePrefix: 'INV-',
  defaultTaxPercent: 18,
  bankDetails: '',
  loginPages: [
    {
      __typename: 'LoginPage',
      app: 'finance',
      name: 'Finance',
      tagline: 'Invoices and billing',
      backgroundImageUrl: 'https://images.example.com/finance.jpg',
      accentColor: '#0ea5e9',
    },
  ],
  ...overrides,
});
