import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, MenuItem, Stack, TextField } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { MetricChart } from '@exyconn/shell/components/dashboard/MetricChart';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useApiKeyUsageQuery } from '@exyconn/shell/graphql/generated';
import type { ApiKeyRow } from './ApiKeysPanel';

/** The periods the usage chart offers, in days. */
const PERIODS = [7, 30, 90] as const;

interface ApiKeyUsageDialogProps {
  apiKey: ApiKeyRow | null;
  onClose: () => void;
}

/** One key's requests per day over the chosen period, as a bar chart with its table twin. */
export function ApiKeyUsageDialog({ apiKey, onClose }: Readonly<ApiKeyUsageDialogProps>) {
  const t = useT();
  const { formatDate } = useSettings();
  const [days, setDays] = useState<number>(PERIODS[1]);
  const { data, loading, error } = useApiKeyUsageQuery({
    variables: { id: apiKey?.id ?? '', days },
    skip: apiKey === null,
    fetchPolicy: 'cache-and-network',
  });
  const metrics = (data?.apiKeyUsage ?? []).map((row) => ({
    label: formatDate(`${row.day}T00:00:00Z`),
    value: row.count,
  }));
  const title = apiKey ? t('Usage — {name}', { name: apiKey.name }) : '';

  let body = (
    <MetricChart
      title="Requests per day"
      metrics={metrics}
      formatValue={String}
      labelHeading="Day (UTC)"
      integer
    />
  );
  if (error) {
    body = <Alert severity="error">{errorMessage(error, t('Usage could not be loaded'))}</Alert>;
  } else if (!data && loading) {
    body = <LoadingState />;
  }

  return (
    <CrudDialog open={apiKey !== null} title={title} onClose={onClose}>
      <Stack spacing={2}>
        <TextField
          select
          size="small"
          label={t('Period')}
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          sx={{ maxWidth: 200 }}
        >
          {PERIODS.map((period) => (
            <MenuItem key={period} value={period}>
              {t('Last {days} days', { days: period })}
            </MenuItem>
          ))}
        </TextField>
        {body}
      </Stack>
    </CrudDialog>
  );
}
