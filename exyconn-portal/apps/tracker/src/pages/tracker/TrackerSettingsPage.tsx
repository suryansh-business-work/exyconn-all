import { useT } from '@exyconn/i18n';
import { Box, Grid, Heading, Text, CircularProgress } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';

import { useTrackerSettingsQuery } from '@exyconn/shell/graphql/generated';
import { TrackerSettingsForm } from './forms/tracker-settings';
import { readingPanel } from '@exyconn/shell/components/glass/glass';

/** Hosts the tracker capture-settings form, prefilled from the current settings. */
export function TrackerSettingsPage() {
  const t = useT();
  const { data, loading } = useTrackerSettingsQuery({ fetchPolicy: 'cache-and-network' });
  const settings = data?.trackerSettings;
  const spinnerLabel = loading ? t('Loading settings') : t('No settings');

  return (
    <Box>
      <PageHeader title="Tracker Settings" subtitle="Capture cadence & privacy controls" />
      <Grid container spacing={2}>
        <Grid
          size={{
            xs: 12,
            md: 8,
            lg: 7,
          }}
        >
          <Box sx={readingPanel}>
            <Heading level={6} sx={{ mb: 0.5 }}>
              {t('Capture settings')}
            </Heading>
            <Text size="sm" color="text.secondary" sx={{ mb: 2 }}>
              {t('Applies to every enrolled desktop agent.')}
            </Text>
            {settings ? (
              <TrackerSettingsForm initial={settings} />
            ) : (
              <CircularProgress size={22} aria-label={spinnerLabel} />
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
