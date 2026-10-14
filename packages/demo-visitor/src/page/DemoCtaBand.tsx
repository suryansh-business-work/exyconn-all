import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useT } from '@exyconn/i18n';
import { Box, Button, Container, Stack, Typography } from '@exyconn/shell/components/ui';
import { useDemoBranding } from './useDemoBranding';

interface DemoCtaBandProps {
  title: string;
  subtitle: string;
}

/**
 * The close of every demo page: what to do once the demo has convinced you. Talks to the
 * company's website (Admin > Branding), so it disappears rather than linking nowhere.
 */
export function DemoCtaBand({ title, subtitle }: Readonly<DemoCtaBandProps>) {
  const t = useT();
  const { websiteUrl, supportEmail } = useDemoBranding();
  if (!websiteUrl) {
    return null;
  }
  return (
    <Box
      component="section"
      aria-labelledby="demo-cta-title"
      sx={{ py: { xs: 6, md: 8 }, bgcolor: 'primary.main', color: 'primary.contrastText' }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
        >
          <Box sx={{ maxWidth: 640 }}>
            <Typography
              id="demo-cta-title"
              variant="h4"
              component="h2"
              sx={{ fontWeight: 'fontWeightBold', mb: 1 }}
            >
              {t(title)}
            </Typography>
            <Typography sx={{ opacity: 0.9 }}>{t(subtitle)}</Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="contained"
              size="large"
              href={`${websiteUrl}/contact`}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<ArrowForwardIcon />}
              // The band is the primary colour, which flips with the mode; the surface colours
              // keep this button readable on it either way.
              sx={{
                bgcolor: 'background.paper',
                color: 'text.primary',
                '&:hover': { bgcolor: 'background.default' },
              }}
            >
              {t('Book a free consultation')}
            </Button>
            {supportEmail && (
              <Button
                variant="outlined"
                color="inherit"
                size="large"
                href={`mailto:${supportEmail}`}
              >
                {t('Email us')}
              </Button>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
