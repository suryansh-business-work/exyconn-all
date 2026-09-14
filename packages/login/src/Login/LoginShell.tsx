import type { ReactNode } from 'react';
import {
  CARD_RADIUS,
  Box,
  Button,
  readableInk,
  Divider,
  Flex,
  IconButton,
  radius,
  Text,
  zIndex,
} from '@exyconn/shell/components/ui';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { LoginBackground } from './LoginBackground';
import { LoginPromo } from './LoginPromo';
import { OtherPortalsLink } from './OtherPortalsLink';
import { useLoginPage, type LoginPageView } from './useLoginPage';
import { env } from '@exyconn/shell/config/env';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { useColorMode } from '@exyconn/shell/theme/ColorModeContext';
import { useT } from '@exyconn/i18n';

interface LoginShellProps {
  /** The card body under the logo row: heading, form, footnotes. */
  children: (page: LoginPageView) => ReactNode;
}

/**
 * The front-door layout every public screen shares — sign-in and the reset-password page
 * a mailed link opens: the two-card layout over full-bleed artwork, with the artwork, the
 * portal name, the tagline and the accent from Admin > Branding > Login Pages for whichever
 * subdomain is serving it, so no two portals share a front door.
 */
export function LoginShell({ children }: Readonly<LoginShellProps>) {
  const t = useT();
  const { mode, toggle } = useColorMode();
  const isDark = mode === 'dark';
  const page = useLoginPage(isDark);

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, md: 4 },
        overflow: 'hidden',
      }}
    >
      <LoginBackground
        imageUrl={page.backgroundImageUrl}
        accentColor={page.accentColor}
        isDark={isDark}
      />

      <IconButton
        onClick={toggle}
        aria-label={t('toggle color mode')}
        sx={{ position: 'absolute', top: 16, right: 16, zIndex: zIndex.overlay }}
      >
        {isDark ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>

      <Flex
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems="stretch"
        justifyContent="center"
        // Bounded by the screen, not by its contents: without this the card sizes itself to
        // its longest line and a phone shows the left two-thirds of a sign-in form.
        sx={{ position: 'relative', zIndex: zIndex.raised, width: '100%', maxWidth: 1100 }}
      >
        <Flex direction="column" spacing={2} sx={{ width: '100%', maxWidth: 380, minWidth: 0 }}>
          <Box sx={[readingPanel, { width: '100%', borderRadius: `${CARD_RADIUS}px` }]}>
            <Flex direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Box component="img" src={page.logoUrl} alt={page.businessName || env.logoAlt} sx={{ height: 26 }} />
              <Button
                href={env.brandUrl}
                target="_blank"
                rel="noopener"
                size="small"
                sx={{ borderRadius: `${radius.pill}px`, bgcolor: 'action.hover', px: 2 }}
              >
                {t('Support')}
              </Button>
            </Flex>

            {children(page)}

            <Divider sx={{ my: 1.5 }} />
            <OtherPortalsLink accentColor={page.accentColor} />
          </Box>

          {page.tagline && (
            <Box
              sx={{
                bgcolor: page.accentColor,
                color: readableInk(page.accentColor),
                borderRadius: `${CARD_RADIUS}px`,
                // Padding counts inside the width, and the strip takes the column's width
                // rather than its own text's — either one alone lets it run off a phone.
                boxSizing: 'border-box',
                width: '100%',
                minWidth: 0,
                px: 3,
                py: 2,
                textAlign: 'center',
              }}
            >
              <Text weight="bold">{page.tagline}</Text>
            </Box>
          )}
        </Flex>

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <LoginPromo name={page.name} slogan={page.slogan} accentColor={page.accentColor} />
        </Box>
      </Flex>
    </Box>
  );
}
