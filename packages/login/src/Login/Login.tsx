import { Navigate, useSearchParams } from 'react-router-dom';
import { Box, Button, Flex, Heading, IconButton, Text } from '@exyconn/shell/components/ui';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { LoginForm } from './forms/login';
import { LoginBackground } from './LoginBackground';
import { LoginPromo } from './LoginPromo';
import { useLoginPage } from './useLoginPage';
import { env } from '@exyconn/shell/config/env';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { useColorMode } from '@exyconn/shell/theme/ColorModeContext';
import { safeNext } from '@exyconn/shell/utils/redirect';

/**
 * Login screen: the two-card layout — sign-in card and banner beside a promo card — over
 * full-bleed artwork. One form and one set of credentials everywhere; the artwork, the
 * portal name, the tagline and the accent come from Admin > Branding > Login Pages for
 * whichever subdomain is serving it, so no two portals share a front door.
 */
export function Login() {
  const { mode, toggle } = useColorMode();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const isDark = mode === 'dark';
  const page = useLoginPage(isDark);

  // An already-signed-in user never sees the login screen — bounce them to the
  // page they were after (or the portal home).
  if (user) return <Navigate to={safeNext(params.get('next'))} replace />;

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
        sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}
      >
        {isDark ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>

      <Flex
        direction={{ xs: 'column', md: 'row' }}
        spacing={2.5}
        alignItems="stretch"
        sx={{ position: 'relative', zIndex: 1 }}
      >
        <Flex direction="column" spacing={2}>
          <Box sx={[glass, { width: { xs: '100%', sm: 380 }, p: 3, borderRadius: 4 }]}>
            <Flex direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Box component="img" src={page.logoUrl} alt={page.businessName} sx={{ height: 26 }} />
              <Button
                href={env.brandUrl}
                target="_blank"
                rel="noopener"
                size="small"
                sx={{ borderRadius: '999px', bgcolor: 'action.hover', px: 1.75 }}
              >
                Support
              </Button>
            </Flex>

            <Heading level={4} sx={{ mb: 2 }}>
              Sign in to {page.name}
            </Heading>
            <LoginForm accentColor={page.accentColor} />

            <Text size="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Authorized personnel only.
              {page.supportEmail ? ` Need access? ${page.supportEmail}` : ''}
            </Text>
          </Box>

          <Box
            sx={{
              bgcolor: page.accentColor,
              color: '#fff',
              borderRadius: 4,
              px: 3,
              py: 2,
              textAlign: 'center',
            }}
          >
            <Text fontWeight={700}>{page.tagline}</Text>
          </Box>
        </Flex>

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <LoginPromo name={page.name} slogan={page.slogan} accentColor={page.accentColor} />
        </Box>
      </Flex>
    </Box>
  );
}
