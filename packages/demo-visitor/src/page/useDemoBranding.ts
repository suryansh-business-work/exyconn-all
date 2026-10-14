import { useColorMode } from '@exyconn/shell/theme/ColorModeContext';
import { usePublicBrandingQuery } from '@exyconn/shell/graphql/generated';
import { env } from '@exyconn/shell/config/env';

/** What a demo page shows of the company: from Admin > Branding, the stock mark until then. */
export interface DemoBranding {
  logoUrl: string;
  name: string;
  /** The company's website, for "talk to us"; empty until branding answers. */
  websiteUrl: string;
  supportEmail: string;
  legalName: string;
}

/** The company's public branding, the logo matched to the colour mode. */
export function useDemoBranding(): DemoBranding {
  const { mode } = useColorMode();
  const { data } = usePublicBrandingQuery();
  const branding = data?.publicBranding;
  const isDark = mode === 'dark';
  const brandLogo = isDark ? branding?.logoDarkUrl : branding?.logoUrl;
  const stockLogo = isDark ? env.logoDarkUrl : env.logoUrl;
  return {
    logoUrl: brandLogo || stockLogo,
    name: branding?.businessName || env.logoAlt,
    websiteUrl: (branding?.websiteUrl ?? '').replace(/\/$/, ''),
    supportEmail: branding?.supportEmail ?? '',
    legalName: branding?.legalName || branding?.businessName || env.logoAlt,
  };
}
