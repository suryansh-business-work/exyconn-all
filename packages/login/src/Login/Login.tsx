import { Navigate, useSearchParams } from 'react-router-dom';
import { Box, Chip, Flex, Heading, IconButton, Text } from '@exyconn/shell/components/ui';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { LoginForm } from './forms/login';
import { LoginBackground } from './LoginBackground';
import { useLoginPage } from './useLoginPage';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { useColorMode } from '@exyconn/shell/theme/ColorModeContext';
import { safeNext } from '@exyconn/shell/utils/redirect';

/**
 * Login screen. One form, one set of credentials — the artwork, the portal name and the
 * accent come from Admin > Branding > Login Pages for whichever subdomain is serving it,
 * so `finance.exyconn.com` and `hr.exyconn.com` look like their own front doors.
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
        display: 'grid',
        placeItems: 'center',
        p: 2,
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
        sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}
      >
        {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
      </IconButton>

      <Box sx={[glass, { position: 'relative', zIndex: 1, width: '100%', maxWidth: 380, p: 2.5 }]}>
        <Flex direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Box component="img" src={page.logoUrl} alt={page.businessName} sx={{ height: 22 }} />
          <Chip
            size="small"
            label={page.name}
            sx={{ bgcolor: page.accentColor, color: '#fff', fontWeight: 700 }}
          />
        </Flex>

        <Heading level={5} sx={{ mb: 0.25 }}>
          Sign in to {page.name}
        </Heading>
        <Text size="sm" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          {page.tagline}
        </Text>

        <LoginForm accentColor={page.accentColor} />

        <Text size="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Authorized personnel only.
          {page.supportEmail ? ` Need access? ${page.supportEmail}` : ''}
        </Text>
      </Box>
    </Box>
  );
}
