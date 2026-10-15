import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Button,
  Container,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from '@exyconn/shell/components/ui';
import type { PortalAppKey } from '@exyconn/shell/config/apps';
import { useColorMode } from '@exyconn/shell/theme/ColorModeContext';
import { ALL_DEMOS_URL, DEMO_LINKS } from './demoLinks';
import { useDemoBranding } from './useDemoBranding';

/**
 * The bar across every demo page: the logo back to all demos, a link to each demo (the one
 * being shown marked as current), colour mode, and "Talk to us" on the company's website.
 */
export function DemoHeader({ current }: Readonly<{ current?: PortalAppKey }>) {
  const t = useT();
  const { mode, toggle } = useColorMode();
  const branding = useDemoBranding();
  const modeLabel = mode === 'dark' ? t('Switch to light mode') : t('Switch to dark mode');
  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 'appBar',
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 1.5 }}>
          <Link
            href={ALL_DEMOS_URL}
            underline="none"
            color="inherit"
            aria-label={t('Live demos by {name}', { name: branding.name })}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
          >
            <Box component="img" src={branding.logoUrl} alt="" sx={{ height: 28, width: 'auto' }} />
            <Typography component="span" sx={{ fontWeight: 'fontWeightBold' }}>
              {t('Live demos')}
            </Typography>
          </Link>
          <Box
            component="nav"
            aria-label={t('Demos')}
            sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flex: 1 }}
          >
            {DEMO_LINKS.map((demo) => (
              <Button
                key={demo.key}
                href={demo.url}
                color={demo.key === current ? 'primary' : 'inherit'}
                aria-current={demo.key === current ? 'page' : undefined}
              >
                {t(demo.label)}
              </Button>
            ))}
          </Box>
          <Box sx={{ flex: { xs: 1, md: 0 } }} />
          <Tooltip title={modeLabel}>
            <IconButton onClick={toggle} aria-label={modeLabel}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          {branding.websiteUrl && (
            <Button
              variant="contained"
              href={`${branding.websiteUrl}/contact`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('Talk to us')}
            </Button>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
