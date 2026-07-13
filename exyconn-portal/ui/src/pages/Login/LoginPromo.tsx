import { Box, Button, Flex, Heading, Text } from '@/components/ui';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { env } from '../../config/env';

/** Marketing card shown beside the login form (reference two-card layout). */
export function LoginPromo() {
  return (
    <Box
      sx={(t) => ({
        position: 'relative',
        width: 300,
        minHeight: 520,
        p: 3.5,
        borderRadius: 6,
        background: t.palette.mode === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(17,18,27,0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${
          t.palette.mode === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.12)'
        }`,
        boxShadow: '0 30px 70px rgba(16,20,38,0.28)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      })}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          right: -40,
          top: 120,
          width: 220,
          height: 220,
          borderRadius: '46% 54% 60% 40% / 50% 40% 60% 50%',
          background: 'linear-gradient(135deg, #6ea8c8, #88b9d6)',
          opacity: 0.85,
        }}
      />
      <Box sx={{ position: 'relative' }}>
        <Heading level={3} sx={{ fontWeight: 800, lineHeight: 1, color: 'text.primary' }}>
          One
        </Heading>
        <Heading level={3} sx={{ fontWeight: 800, lineHeight: 1, color: 'text.secondary' }}>
          unified
        </Heading>
        <Heading level={3} sx={{ fontWeight: 800, lineHeight: 1, color: 'text.secondary' }}>
          portal
        </Heading>
        <Text size="sm" color="text.secondary" sx={{ mt: 2, maxWidth: 180 }}>
          Every team, every metric — one place. Sign in and get moving.
        </Text>
      </Box>

      <Flex
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ position: 'relative' }}
      >
        <Text size="caption" color="text.secondary">
          By Exyconn
        </Text>
        <Button
          href={env.brandUrl}
          target="_blank"
          rel="noopener"
          endIcon={<ArrowForwardIcon />}
          sx={{
            bgcolor: '#0e1116',
            color: '#fff',
            borderRadius: '999px',
            px: 2,
            '&:hover': { bgcolor: '#000' },
          }}
        >
          Explore
        </Button>
      </Flex>
    </Box>
  );
}
