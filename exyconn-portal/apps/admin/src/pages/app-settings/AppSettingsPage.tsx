import { Box, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useAppSettingsQuery } from '@exyconn/shell/graphql/generated';
import { AppSettingsForm } from './forms/app-settings';

/** Admin → App Settings: the date format, time format and timezone every portal renders with. */
export function AppSettingsPage() {
  const { data, loading } = useAppSettingsQuery();
  const settings = data?.appSettings;
  const emptyMessage = loading ? 'Loading…' : 'App settings are unavailable.';

  return (
    <Box>
      <PageHeader
        title="App Settings"
        subtitle="Date, time and timezone formatting used across every app"
      />
      <Box sx={[glass, { p: { xs: 2, md: 3 }, maxWidth: 640 }]}>
        {settings ? (
          <AppSettingsForm initial={settings} />
        ) : (
          <Text size="sm" color="text.secondary">
            {emptyMessage}
          </Text>
        )}
      </Box>
    </Box>
  );
}
