import type { ReactNode } from 'react';
import {
  CARD_RADIUS,
  Box,
  Button,
  color,
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
import { glass } from '@exyconn/shell/components/glass/glass';
import { useColorMode } from '@exyconn/shell/theme/ColorModeContext';

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
        aria-label="toggle color mode"
        sx={{ position: 'absolute', top: 16, right: 16, zIndex: zIndex.overlay }}
      >
        {isDark ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>

      <Flex
        direction={{ xs: 'column', md: 'row' }}
        spacing={2.5}
        alignItems="stretch"
        sx={{ position: 'relative', zIndex: zIndex.raised }}
      >
        <Flex direction="column" spacing={2}>
          <Box
            sx={[glass, { width: { xs: '100%', sm: 380 }, p: 3, borderRadius: `${CARD_RADIUS}px` }]}
          >
            <Flex direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Box component="img" src={page.logoUrl} alt={page.businessName} sx={{ height: 26 }} />
              <Button
                href={env.brandUrl}
                target="_blank"
                rel="noopener"
                size="small"
                sx={{ borderRadius: `${radius.pill}px`, bgcolor: 'action.hover', px: 1.75 }}
              >
                Support
              </Button>
            </Flex>

            {children(page)}

            <Divider sx={{ my: 1.5 }} />
            <OtherPortalsLink accentColor={page.accentColor} />
          </Box>

          <Box
            sx={{
              bgcolor: page.accentColor,
              color: color.white,
              borderRadius: `${CARD_RADIUS}px`,
              px: 3,
              py: 2,
              textAlign: 'center',
            }}
          >
            <Text weight="bold">{page.tagline}</Text>
          </Box>
        </Flex>

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <LoginPromo name={page.name} slogan={page.slogan} accentColor={page.accentColor} />
        </Box>
      </Flex>
    </Box>
  );
}
