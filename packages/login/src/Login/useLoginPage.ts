import { usePublicBrandingQuery } from '@exyconn/shell/graphql/generated';
import { PORTAL_APPS, type PortalAppKey } from '@exyconn/shell/config/apps';
import { env } from '@exyconn/shell/config/env';
import { background, color, ensureContrast } from '@exyconn/ui';

/** Everything the login screen needs to look like *this* portal. */
export interface LoginPageView {
  /** Portal name above the form, e.g. "Finance". */
  name: string;
  /** One line about this portal, from Branding > Login Pages. */
  tagline: string;
  /** The company slogan, shown on the card beside the form. */
  slogan: string;
  /** Full-bleed background; empty renders the flat brand surface instead. */
  backgroundImageUrl: string;
  /**
   * Tint for the overlay and the sign-in button — the portal's own accent, moved just far
   * enough to read as text and as a control on the sign-in panel (WCAG 2.2 AA). An admin can
   * pick any colour; a pale one used to leave "Other Portals" unreadable.
   */
  accentColor: string;
  /** Wordmark for the current colour mode. */
  logoUrl: string;
  businessName: string;
  supportEmail: string;
}

const FALLBACK_ACCENT = color.blue[600];

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
    slogan: branding?.slogan ?? '',
    backgroundImageUrl: page?.backgroundImageUrl ?? '',
    accentColor: ensureContrast(
      page?.accentColor || FALLBACK_ACCENT,
      background[isDark ? 'dark' : 'light'].panel,
    ),
    logoUrl: brandLogo || (isDark ? env.logoDarkUrl : env.logoUrl),
    businessName: branding?.businessName ?? '',
    supportEmail: branding?.supportEmail ?? '',
  };
}
