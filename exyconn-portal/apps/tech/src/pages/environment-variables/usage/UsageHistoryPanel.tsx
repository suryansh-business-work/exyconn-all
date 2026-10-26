import { useMemo } from 'react';
import { usePagedFetcher } from '@exyconn/crud';
import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { ServerDataGrid } from '@exyconn/shell/components/data/ServerDataGrid';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import { statCount, statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import { color } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ListIntegrationCallsPagedDocument,
  useListIntegrationCallsStatsQuery,
  type ListIntegrationCallsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { CALL_COLUMNS, type CallsGridContext } from './calls-grid';

/** Small amounts are the point here: a single call can cost a fraction of a cent. */
const USD_DIGITS = 6;

/**
 * Environment Variables > Usage history: every call any portal, the website or a background job
 * made with a stored credential — which service, which call, who, from where, how long, tokens
 * and cost. Paged, searched and filtered on the server; kept 180 days.
 */
export function UsageHistoryPanel() {
  const { formatDateTime, formatNumber, locale } = useSettings();
  const { data, loading } = useListIntegrationCallsStatsQuery({ fetchPolicy: 'cache-and-network' });
  const fetchRows = usePagedFetcher(
    ListIntegrationCallsPagedDocument,
    (result: ListIntegrationCallsPagedQuery) => result.listIntegrationCallsPaged,
  );
  const usd = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: USD_DIGITS,
      }),
    [locale],
  );
  const context = useMemo<CallsGridContext>(
    () => ({ formatDateTime, formatUsd: (value) => usd.format(value) }),
    [formatDateTime, usd],
  );

  const stats = data?.listIntegrationCallsStats;
  const tokens = statSum(stats, 'inputTokens') + statSum(stats, 'outputTokens');
  const statItems: StatItem[] = [
    { label: 'Calls', value: formatNumber(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Failed',
      value: formatNumber(statCount(stats, 'ok', 'false')),
      accent: color.red[200],
    },
    {
      label: 'Cost (priced calls)',
      value: usd.format(statSum(stats, 'costUsd')),
      accent: color.green[300],
    },
    { label: 'Tokens', value: formatNumber(tokens), accent: color.violet[400] },
  ];

  return (
    <Box>
      <PageHeader
        title="Usage history"
        subtitle="Every call made with a stored credential, from every portal, the website and background jobs: which service, who, from where, how long and what it cost. Cost is shown where a price is kept (AI models); others show their units."
      />
      <Box sx={{ mb: 2 }}>
        <StatRow stats={statItems} loading={!data && loading} />
      </Box>
      <ServerDataGrid
        columnDefs={CALL_COLUMNS}
        fetchRows={fetchRows}
        context={context}
        searchPlaceholder="Search calls, people, sites or errors…"
      />
    </Box>
  );
}
