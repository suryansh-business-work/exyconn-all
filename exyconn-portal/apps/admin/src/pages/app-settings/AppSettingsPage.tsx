import { useT } from '@exyconn/i18n';
import { Box, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { FormSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { useAppSettingsQuery } from '@exyconn/shell/graphql/generated';
import { AppSettingsForm } from './forms/app-settings';

/** Admin › System › Settings: the date format, time format and timezone every portal renders with. */
export function AppSettingsPage() {
  const t = useT();
  const { data, loading } = useAppSettingsQuery();
  const settings = data?.appSettings;
  let body = (
    <Text size="sm" color="text.secondary">
      {t('App settings are unavailable.')}
    </Text>
  );
  if (settings) {
    body = <AppSettingsForm initial={settings} />;
  } else if (loading) {
    body = <FormSkeleton fields={3} surface={false} label="Loading app settings" />;
  }

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="The default date, time and timezone every app uses. People can override them on their profile."
      />
      <Box sx={[readingPanel, { maxWidth: 640 }]}>{body}</Box>
    </Box>
  );
}
