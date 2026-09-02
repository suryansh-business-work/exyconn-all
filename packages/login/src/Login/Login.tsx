import { Navigate, useSearchParams } from 'react-router-dom';
import { Box, Button, Flex, Heading, IconButton, Text } from '@exyconn/shell/components/ui';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { LoginForm } from './forms/login';
import { LoginPromo } from './LoginPromo';
import { env } from '@exyconn/shell/config/env';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { useColorMode } from '@exyconn/shell/theme/ColorModeContext';
import { safeNext } from '@exyconn/shell/utils/redirect';

/** Login screen: flat card + promo + banner over the brand video. */
export function Login() {
  const { mode, toggle } = useColorMode();
  const { user } = useAuth();
  const [params] = useSearchParams();

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
        bgcolor: 'background.default',
      }}
    >
      <Box
        component="video"
        src={env.loginVideoUrl}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'saturate(1.05)',
          transform: 'scale(1.12)',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            mode === 'light'
              ? 'linear-gradient(180deg, rgba(246,248,251,0.72), rgba(246,248,251,0.55))'
              : 'linear-gradient(180deg, rgba(11,14,23,0.78), rgba(11,14,23,0.6))',
        }}
      />

      <IconButton
        onClick={toggle}
        aria-label="toggle color mode"
        sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}
      >
        {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>

      <Flex
        direction={{ xs: 'column', md: 'row' }}
        spacing={2.5}
        alignItems="stretch"
        sx={{ position: 'relative', zIndex: 1 }}
      >
        <Flex direction="column" spacing={2}>
          <Box
            sx={[
              glass,
              {
                width: { xs: '100%', sm: 380 },
                p: 3,
                borderRadius: 4,
              },
            ]}
          >
            <Flex direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Box
                component="img"
                src={mode === 'dark' ? env.logoDarkUrl : env.logoUrl}
                alt="Exyconn"
                sx={{ height: 26 }}
              />
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
              Log in
            </Heading>
            <LoginForm />
          </Box>

          <Box
            sx={{
              bgcolor: '#0e1116',
              color: '#fff',
              borderRadius: 4,
              px: 3,
              py: 2,
              textAlign: 'center',
            }}
          >
            <Text fontWeight={700}>Track, analyze, decide — all in one place.</Text>
          </Box>
        </Flex>

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <LoginPromo />
        </Box>
      </Flex>
    </Box>
  );
}
