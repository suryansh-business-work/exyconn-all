import {
  CARD_RADIUS,
  alpha,
  borderWidth,
  Box,
  boxShadow,
  Button,
  color,
  Flex,
  Heading,
  radius,
  Text,
} from '@exyconn/shell/components/ui';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { env } from '@exyconn/shell/config/env';

interface LoginPromoProps {
  /** Portal name from branding, e.g. "Finance" — the headline of this card. */
  name: string;
  /** The company slogan — the line under the portal name. */
  slogan: string;
  /** This portal's accent, so the card reads as the same site as the sign-in button. */
  accentColor: string;
}

/**
 * The card beside the sign-in form. Its wording and its accent come from
 * Admin > Branding > Login Pages for whichever subdomain is serving the page, so
 * `finance.exyconn.com` and `hr.exyconn.com` are told apart before signing in.
 */
export function LoginPromo({ name, slogan, accentColor }: Readonly<LoginPromoProps>) {
  return (
    <Box
      sx={(t) => ({
        position: 'relative',
        width: 300,
        minHeight: 520,
        p: 3.5,
        borderRadius: `${CARD_RADIUS}px`,
        background: t.palette.background.paper,
        border: `${borderWidth.hairline}px solid ${t.palette.divider}`,
        boxShadow: boxShadow[t.palette.mode].md,
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
          background: `linear-gradient(135deg, ${accentColor}, ${alpha(accentColor, 0.55)})`,
          opacity: 0.85,
        }}
      />
      <Box sx={{ position: 'relative' }}>
        <Heading level={3} sx={{ fontWeight: 800, lineHeight: 1.05, color: 'text.primary' }}>
          {name}
        </Heading>
        <Text size="sm" color="text.secondary" sx={{ mt: 2, display: 'block', maxWidth: 200 }}>
          {slogan}
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
            bgcolor: accentColor,
            color: color.white,
            borderRadius: `${radius.pill}px`,
            px: 2,
            '&:hover': { bgcolor: accentColor, opacity: 0.9 },
          }}
        >
          Explore
        </Button>
      </Flex>
    </Box>
  );
}
