import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Container,
  Flex,
  IconButton,
  Tooltip,
  Typography,
} from '@exyconn/shell/components/ui';
import { useColorMode } from '@exyconn/shell/theme/ColorModeContext';
import { usePublicBrandingQuery } from '@exyconn/shell/graphql/generated';
import { env } from '@exyconn/shell/config/env';

/** Brand bar: the company's logo (the stock mark until branding answers) and colour mode. */
export function HubHeader() {
  const t = useT();
  const { mode, toggle } = useColorMode();
  const isDark = mode === 'dark';
  const { data } = usePublicBrandingQuery();
  const branding = data?.publicBranding;
  const brandLogo = isDark ? branding?.logoDarkUrl : branding?.logoUrl;
  const stockLogo = isDark ? env.logoDarkUrl : env.logoUrl;
  const modeLabel = isDark ? t('Switch to light mode') : t('Switch to dark mode');

  return (
    <Box component="header" sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Container>
        <Flex alignItems="center" justifyContent="space-between" sx={{ py: 1.5 }}>
          <Flex alignItems="center" gap={1.5}>
            <Box
              component="img"
              src={brandLogo || stockLogo}
              alt={branding?.businessName ?? env.logoAlt}
              sx={{ height: 28, width: 'auto' }}
            />
            <Typography sx={{ fontWeight: 600 }}>{t('Demos')}</Typography>
          </Flex>
          <Tooltip title={modeLabel}>
            <IconButton onClick={toggle} aria-label={modeLabel}>
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Flex>
      </Container>
    </Box>
  );
}
