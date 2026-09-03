import { usePublicBrandingQuery } from '@exyconn/shell/graphql/generated';
import { PORTAL_APPS, type PortalAppKey } from '@exyconn/shell/config/apps';
import { env } from '@exyconn/shell/config/env';

/** Everything the login screen needs to look like *this* portal. */
export interface LoginPageView {
  /** Portal name above the form, e.g. "Finance". */
  name: string;
  tagline: string;
  /** Full-bleed background; empty renders the flat brand surface instead. */
  backgroundImageUrl: string;
  /** Tint for the overlay and the sign-in button. */
  accentColor: string;
  /** Wordmark for the current colour mode. */
  logoUrl: string;
  businessName: string;
  supportEmail: string;
}

const FALLBACK_ACCENT = '#155dfc';

/** Registry title minus the product suffix — shown until branding resolves. */
const registryName = (app: PortalAppKey): string => PORTAL_APPS[app].title.split(' · ')[0];

/**
 * Resolves the login screen configuration for the app this bundle is.
 *
 * Every portal signs in through the same form; only the artwork and the wording change,
 * and both are edited in Admin > Branding > Login Pages. `publicBranding` is deliberately
 * unauthenticated, so this reads before anyone has a token. Empty strings fall through to
 * the registry/brand defaults, which is what an admin clearing a field should mean.
 */
export function useLoginPage(isDark: boolean): LoginPageView {
  const { data } = usePublicBrandingQuery();
  const branding = data?.publicBranding;
  const page = branding?.loginPages.find((entry) => entry.app === env.portalApp);
  const brandLogo = isDark ? branding?.logoDarkUrl : branding?.logoUrl;

  return {
    name: page?.name || registryName(env.portalApp),
    tagline: page?.tagline ?? '',
    backgroundImageUrl: page?.backgroundImageUrl ?? '',
    accentColor: page?.accentColor || FALLBACK_ACCENT,
    logoUrl: brandLogo || (isDark ? env.logoDarkUrl : env.logoUrl),
    businessName: branding?.businessName ?? '',
    supportEmail: branding?.supportEmail ?? '',
  };
}
