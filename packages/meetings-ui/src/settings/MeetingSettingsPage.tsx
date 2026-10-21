import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { FormSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { useMaSettingsQuery } from '@exyconn/shell/graphql/generated';
import { MeetingSettingsForm } from '../forms/meeting-settings';
import { LoadError } from '../lib/LoadError';

const USD = { currency: 'USD' } as const;

/** AI → Meeting Assistant → Settings: the company-wide switches, limits and spend so far. */
export function MeetingSettingsPage() {
  const t = useT();
  const { formatCurrency, formatDateTime } = useFormatters();
  const { data, error, refetch } = useMaSettingsQuery({ fetchPolicy: 'cache-and-network' });
  const settings = data?.maSettings;

  let body;
  if (error && !settings) {
    body = <LoadError message={error.message} onRetry={() => refetch()} />;
  } else if (settings) {
    body = (
      <>
        <Text size="sm" color="text.secondary" component="p" sx={{ mt: 0 }}>
          {t('AI spend this month: {spent} of {budget}', {
            spent: formatCurrency(settings.monthSpendUsd, USD),
            budget: formatCurrency(settings.monthlyBudgetUsd, USD),
          })}
          {settings.updatedAt &&
            ` · ${t('Last saved by {name} on {when}', {
              name: settings.updatedByName,
              when: formatDateTime(settings.updatedAt),
            })}`}
        </Text>
        <MeetingSettingsForm settings={settings} />
      </>
    );
  } else {
    body = <FormSkeleton />;
  }

  return (
    <>
      <PageHeader
        title="Meeting Assistant settings"
        subtitle="How the assistant works for the whole company"
      />
      <Box sx={panel}>{body}</Box>
    </>
  );
}
