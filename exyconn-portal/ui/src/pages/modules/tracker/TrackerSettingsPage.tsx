import { Box, Grid, Heading, Text, CircularProgress } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { glass } from '@/components/glass/glass';
import { useTrackerSettingsQuery } from '@/graphql/generated';
import { TrackerSettingsForm } from './forms/tracker-settings';

/** Hosts the tracker capture-settings form, prefilled from the current settings. */
export function TrackerSettingsPage() {
  const { data, loading } = useTrackerSettingsQuery({ fetchPolicy: 'cache-and-network' });
  const settings = data?.trackerSettings;

  return (
    <Box>
      <PageHeader title="Tracker Settings" subtitle="Capture cadence & privacy controls" />
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8} lg={7}>
          <Box sx={[glass, { p: 3 }]}>
            <Heading level={6} sx={{ mb: 0.5 }}>
              Capture settings
            </Heading>
            <Text size="sm" color="text.secondary" sx={{ mb: 2 }}>
              Applies to every enrolled desktop agent.
            </Text>
            {settings ? (
              <TrackerSettingsForm initial={settings} />
            ) : (
              <CircularProgress
                size={22}
                aria-label={loading ? 'Loading settings' : 'No settings'}
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
