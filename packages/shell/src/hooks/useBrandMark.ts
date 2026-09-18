import { useBrandingQuery } from '@/graphql/generated';
import { useColorMode } from '@/theme/ColorModeContext';
import { env } from '@/config/env';

/**
 * The image for a colour mode: dark mode takes the dark variant when Admin › Branding has
 * one, and the light image otherwise; an unset light image means the built-in default.
 */
export function pickBrandImage(
  isDark: boolean,
  light: string | undefined,
  dark: string | undefined,
  fallback: string,
): string {
  if (isDark && dark) return dark;
  return light || fallback;
}

/**
 * The organisation's icon mark (Admin › Branding › Favicon) for the current colour mode —
 * the sidebar mark and the browser-tab icon of every signed-in portal page.
 */
export function useBrandMark(): string {
  const { mode } = useColorMode();
  const { data } = useBrandingQuery();
  const branding = data?.branding;
  return pickBrandImage(
    mode === 'dark',
    branding?.faviconUrl,
    branding?.faviconDarkUrl,
    env.iconUrl,
  );
}
