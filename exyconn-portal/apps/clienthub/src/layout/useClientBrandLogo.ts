import { pickBrandImage } from '@exyconn/shell/hooks/useBrandMark';
import { useColorMode } from '@exyconn/shell/theme/ColorModeContext';
import { env } from '@exyconn/shell/config/env';
import { usePublicBrandingQuery } from '@exyconn/shell/graphql/generated';

/**
 * The organisation's wordmark for the current colour mode. A client is not an employee, so
 * this reads the public branding rather than the signed-in one the portals use.
 */
export function useClientBrandLogo(): string {
  const { mode } = useColorMode();
  const { data } = usePublicBrandingQuery({ fetchPolicy: 'cache-first' });
  const branding = data?.publicBranding;
  const fallback = mode === 'dark' ? env.logoDarkUrl : env.logoUrl;
  return pickBrandImage(mode === 'dark', branding?.logoUrl, branding?.logoDarkUrl, fallback);
}
