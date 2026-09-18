import { useT } from '@exyconn/i18n';
import { Box, Stack, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useItSettingsQuery } from '@exyconn/shell/graphql/generated';
import { ItSettingsForm } from './forms/it-settings';
import { OwnedSettingsLinks } from './OwnedSettingsLinks';

/** IT › Admin Settings: IT's own configuration, and the way to what other teams own. */
export function SettingsPage() {
  const t = useT();
  const { data, loading, error, refetch } = useItSettingsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const settings = data?.itSettings;

  let body = <Text color="text.secondary">{t('Loading…')}</Text>;
  if (settings) {
    body = (
      <ItSettingsForm
        settings={settings}
        onSaved={() => {
          refetch().catch((reason: unknown) => console.error('Could not reload settings', reason));
        }}
      />
    );
  } else if (error && !loading) {
    body = <Text color="error">{error.message}</Text>;
  }

  return (
    <Box>
      <PageHeader
        title="IT Admin Settings"
        subtitle="Applications, onboarding defaults, ticket topics and expiry warnings"
      />
      <Stack spacing={2}>
        <Box sx={panel}>{body}</Box>
        <OwnedSettingsLinks />
      </Stack>
    </Box>
  );
}
