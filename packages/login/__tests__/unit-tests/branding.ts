/** The default bundle the tests run as (`env.portalApp` with no VITE_PORTAL_APP set). */
export const BUNDLE = 'hub';

/** The registry title for the default bundle, shown while branding says nothing. */
export const REGISTRY_NAME = 'Exyconn Track';

/** One login page entry, as Admin > Branding > Login Pages stores it. */
export interface LoginPageEntry {
  app: string;
  name?: string;
  tagline?: string;
  accentColor?: string;
  backgroundImageUrl?: string;
}

/** The fields of `publicBranding` the login screens read. */
export interface PublicBrandingStub {
  businessName?: string;
  slogan?: string;
  supportEmail?: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  faviconDarkUrl?: string;
  loginPages: LoginPageEntry[];
}

/** A `usePublicBrandingQuery` result carrying `branding` (or nothing, before it resolves). */
export function brandingResult(branding?: PublicBrandingStub) {
  return { data: branding ? { publicBranding: branding } : undefined };
}
