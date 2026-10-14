import PhoneDisabledIcon from '@mui/icons-material/PhoneDisabled';
import { useT } from '@exyconn/i18n';
import { Box, Container, Grid, Text, Typography } from '@exyconn/shell/components/ui';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { useCallingBotAvailabilityQuery } from '@exyconn/shell/graphql/generated';
import { BrowserCallPanel } from '../components/BrowserCallPanel';
import { PhoneCallPanel } from '../components/PhoneCallPanel';

/**
 * demos.exyconn.com/calling-bot-demo: talk to the AI calling bot in the browser, or have it
 * ring your phone when the install has a Vobiz number.
 */
export function CallPage() {
  const t = useT();
  const { data, loading } = useCallingBotAvailabilityQuery({ fetchPolicy: 'cache-and-network' });
  const availability = data?.callingBotAvailability;

  let content;
  if (loading && !availability) {
    content = <LoadingState />;
  } else if (availability?.available) {
    content = (
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: availability.phoneEnabled ? 6 : 12 }}>
          <BrowserCallPanel />
        </Grid>
        {availability.phoneEnabled && (
          <Grid size={{ xs: 12, md: 6 }}>
            <PhoneCallPanel />
          </Grid>
        )}
      </Grid>
    );
  } else {
    content = (
      <EmptyState
        icon={<PhoneDisabledIcon />}
        title="The calling bot is not set up yet"
        description="Please check back soon."
      />
    );
  }

  return (
    <Box component="main" sx={{ minHeight: '100vh', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
          {t('Talk to our AI calling bot')}
        </Typography>
        <Text color="text.secondary" sx={{ mb: 4, maxWidth: 680, display: 'block' }}>
          {t(
            'It listens, thinks and answers in real time. Interrupt it whenever you like — it stops and listens, like a person would.',
          )}
        </Text>
        {content}
      </Container>
    </Box>
  );
}
