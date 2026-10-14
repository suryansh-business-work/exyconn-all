import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Chip, Container, Stack, Typography } from '@exyconn/shell/components/ui';

interface DemoHeroProps {
  /** A short label above the title, e.g. "Live demo". */
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Buttons or facts under the subtitle. */
  children?: ReactNode;
  /** What sits beside the words: a photo, or the demo itself. */
  visual: ReactNode;
}

/** The top of a demo page: what it is and why to try it, beside a photo or the live demo. */
export function DemoHero({ eyebrow, title, subtitle, children, visual }: Readonly<DemoHeroProps>) {
  const t = useT();
  return (
    <Box component="section" sx={{ py: { xs: 4, md: 8 }, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 4, md: 6 },
            alignItems: 'center',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.1fr) minmax(0, 1fr)' },
          }}
        >
          <Stack spacing={2.5}>
            <Box>
              <Chip label={t(eyebrow)} color="primary" variant="outlined" size="small" />
            </Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'fontWeightBold' }}>
              {t(title)}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 560 }}>
              {t(subtitle)}
            </Typography>
            {children}
          </Stack>
          <Box>{visual}</Box>
        </Box>
      </Container>
    </Box>
  );
}
