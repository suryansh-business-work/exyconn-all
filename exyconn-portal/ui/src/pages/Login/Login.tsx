import { Box, Button, Flex, Heading, IconButton, Text } from '@/components/ui';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { LoginForm } from './forms/login';
import { LoginPromo } from './LoginPromo';
import { env } from '../../config/env';
import { glass } from '../../components/glass/glass';
import { useColorMode } from '../../theme/ColorModeContext';

const LIGHT_BG =
  'radial-gradient(at 18% 20%, #bcd6ff 0px, transparent 45%), radial-gradient(at 82% 8%, #d9c8ff 0px, transparent 45%), radial-gradient(at 60% 95%, #b6ecdd 0px, transparent 45%), #eef1f8';
const DARK_BG =
  'radial-gradient(at 18% 20%, #1c2c54 0px, transparent 45%), radial-gradient(at 82% 8%, #2a1c46 0px, transparent 45%), radial-gradient(at 60% 95%, #0f3a33 0px, transparent 45%), #06070d';

/** Login screen styled after the Lumin reference: frosted card + promo + banner. */
export function Login() {
  const { mode, toggle } = useColorMode();

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
        background: mode === 'light' ? LIGHT_BG : DARK_BG,
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
          filter: 'blur(6px) saturate(1.05)',
          transform: 'scale(1.12)',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          background:
            mode === 'light'
              ? 'linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0.2))'
              : 'linear-gradient(180deg, rgba(5,6,10,0.62), rgba(5,6,10,0.42))',
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
                background: mode === 'light' ? 'rgba(255,255,255,0.45)' : 'rgba(17,18,27,0.4)',
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
