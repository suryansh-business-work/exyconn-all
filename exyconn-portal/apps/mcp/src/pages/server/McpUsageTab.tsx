import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Link, Skeleton, Stack } from '@exyconn/shell/components/ui';
import { appUrl } from '@exyconn/shell/config/apps';
import { useMcpUsageQuery, type McpEndpoint } from '@exyconn/shell/graphql/generated';
import { McpPeriodSelect } from './McpPeriodSelect';
import { McpUsageInsights } from './McpUsageInsights';

const WINDOWS = [7, 30, 90, 180] as const;

/**
 * What the company used Claude for through one server, and how reliably: see McpUsageInsights.
 * MCP calls themselves are not billed; AI work they start counts in AI spend.
 */
export function McpUsageTab({ endpoint }: Readonly<{ endpoint: McpEndpoint }>) {
  const t = useT();
  const [days, setDays] = useState<number>(30);
  const { data, loading, error } = useMcpUsageQuery({
    variables: { endpoint, days },
    fetchPolicy: 'cache-and-network',
  });
  const usage = data?.mcpUsage;

  let body;
  if (error) {
    body = <Alert severity="error">{error.message}</Alert>;
  } else if (usage) {
    body = (
      <Stack spacing={1.5}>
        <McpUsageInsights usage={usage} endpoint={endpoint} />
        <Alert severity="info">
          {t(
            'Calls through MCP are not billed. AI work a tool starts counts in the AI spend on the',
          )}{' '}
          <Link href={appUrl('ai', '/ai')}>{t('AI overview')}</Link>.
        </Alert>
      </Stack>
    );
  } else {
    body = loading ? <Skeleton variant="rounded" height={280} /> : null;
  }

  return (
    <Stack spacing={1.5}>
      <McpPeriodSelect days={days} windows={WINDOWS} onChange={setDays} />
      {body}
    </Stack>
  );
}
