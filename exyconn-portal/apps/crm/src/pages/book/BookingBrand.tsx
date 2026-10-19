import { useT } from '@exyconn/i18n';
import { Box, Flex, Text } from '@exyconn/shell/components/ui';
import { pickBrandImage } from '@exyconn/shell/hooks/useBrandMark';
import { useColorMode } from '@exyconn/shell/theme/ColorModeContext';
import { env } from '@exyconn/shell/config/env';

export interface Brand {
  organizationName: string;
  logoUrl: string;
  logoDarkUrl: string;
}

/** The company's logo (Admin > Branding) above its booking page, in the page's colour mode. */
export function BookingBrand({ brand }: Readonly<{ brand: Brand }>) {
  const t = useT();
  const { mode } = useColorMode();
  const isDark = mode === 'dark';
  const logo = pickBrandImage(
    isDark,
    brand.logoUrl,
    brand.logoDarkUrl,
    isDark ? env.logoDarkUrl : env.logoUrl,
  );
  return (
    <Flex direction="row" alignItems="center" justifyContent="center" sx={{ mb: { xs: 2, md: 3 } }}>
      <Box
        component="img"
        src={logo}
        alt={t('{company} logo', { company: brand.organizationName })}
        sx={{ height: { xs: 32, md: 40 }, maxWidth: 220, objectFit: 'contain' }}
      />
    </Flex>
  );
}

/** What the booking page says about the visit it counts: nothing that identifies anyone. */
export function BookingPrivacyNote() {
  const t = useT();
  return (
    <Text size="caption" component="p" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
      {t('Visits are counted without cookies or personal data; only your country is kept.')}
    </Text>
  );
}
