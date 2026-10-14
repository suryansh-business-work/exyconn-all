import { useT } from '@exyconn/i18n';
import { Box, Container, Grid, Text, Typography } from '@exyconn/shell/components/ui';
import { DemoCard } from './DemoCard';
import { HubHeader } from './HubHeader';
import { DEMOS } from './demos';

/** demos.exyconn.com: every live demo, each with what it shows and a link into it. */
export function HubPage() {
  const t = useT();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HubHeader />
      <Box component="main" sx={{ flex: 1 }}>
        <Container sx={{ py: { xs: 4, md: 8 } }}>
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
            {t('Try our AI products live')}
          </Typography>
          <Text color="text.secondary" sx={{ mb: 4, maxWidth: 640 }}>
            {t(
              'Each demo runs on the same platform our clients use. Sign in with your email and a one-time code to start.',
            )}
          </Text>
          <Grid container spacing={3} component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {DEMOS.map((demo) => (
              <Grid key={demo.key} size={{ xs: 12, md: 6 }} component="li">
                <DemoCard demo={demo} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
