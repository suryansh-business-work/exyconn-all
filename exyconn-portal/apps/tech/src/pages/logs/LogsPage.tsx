import { useCallback, useEffect, useMemo, useState } from 'react';
import { CrudDashboard, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statSum } from '@exyconn/shell/components/data/tableStats';
import { color } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  AppLogLevel,
  AppLogSource,
  AppLogStatus,
  FilterOp,
  ListAppLogGroupsPagedDocument,
  useListAppLogGroupsStatsQuery,
  type ListAppLogGroupsPagedQuery,
  type TableFilterInput,
} from '@exyconn/shell/graphql/generated';
import { LOG_COLUMNS, type AppLogRow, type LogsGridContext } from './logs-grid';
import { DEFAULT_LOG_FILTERS, LOG_FILTERS, enumLabel } from './logs.constants';
import { LogsToolbar } from './LogsToolbar';
import { LogDetailDialog } from './LogDetailDialog';
import { useLogActions } from './useLogActions';

type Stats = ReturnType<typeof useListAppLogGroupsStatsQuery>['data'];

function statItemsOf(data: Stats): StatItem[] {
  const stats = data?.listAppLogGroupsStats;
  return [
    {
      label: 'Open',
      value: String(statCount(stats, 'status', AppLogStatus.Open)),
      accent: color.orange[500],
    },
    {
      label: 'Errors',
      value: String(statCount(stats, 'level', AppLogLevel.Error)),
      accent: color.red[200],
    },
    { label: 'Occurrences', value: String(statSum(stats, 'count')), accent: color.blue[400] },
    ...Object.values(AppLogSource).map((source) => ({
      label: enumLabel(source),
      value: String(statCount(stats, 'source', source)),
      accent: color.violet[500],
    })),
  ];
}

/**
 * Tech module — every error and debug log from the phone app, the desktop tracker, the
 * portals and the API, one row per distinct problem with how often, for whom and on what.
 * A row's robot button copies a ready-made prompt for Claude to fix it.
 */
export function LogsPage() {
  const { formatDateTime } = useSettings();
  const { data: statsData, refetch: refetchStats } = useListAppLogGroupsStatsQuery();
  const [filters, setFilters] = useState(DEFAULT_LOG_FILTERS);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [viewing, setViewing] = useState<AppLogRow | null>(null);

  const reload = useCallback(() => {
    setRefreshSignal((signal) => signal + 1);
    refetchStats().catch((err: unknown) => console.error('Log stats refresh failed', err));
  }, [refetchStats]);
  const actions = useLogActions(reload);

  const extraFilters = useMemo<TableFilterInput[]>(
    () =>
      LOG_FILTERS.filter((spec) => filters[spec.field] !== '').map((spec) => ({
        field: spec.field,
        op: FilterOp.Equals,
        value: filters[spec.field],
      })),
    [filters],
  );
  const fetchRows = usePagedFetcher(
    ListAppLogGroupsPagedDocument,
    (data: ListAppLogGroupsPagedQuery) => data.listAppLogGroupsPaged,
    extraFilters,
  );

  // The fetcher reads its extra filters at fetch time, so a changed scope has to re-read.
  useEffect(() => {
    setRefreshSignal((signal) => signal + 1);
  }, [extraFilters]);

  const gridContext: LogsGridContext = {
    actions: {
      view: setViewing,
      claude: actions.copyFixPrompt,
      resolve: (row) => actions.changeStatus(row, AppLogStatus.Resolved),
      delete: actions.remove,
    },
    formatDate: formatDateTime,
  };
  const source = (filters.source || null) as AppLogSource | null;

  return (
    <CrudDashboard
      title="Logs"
      subtitle="Errors and debug logs from the phone app, desktop tracker, portals and API"
      entityLabel="log"
      exportFileName="app-logs"
      stats={statItemsOf(statsData)}
      refreshSignal={refreshSignal}
      columnDefs={LOG_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      onRowClick={setViewing}
      searchPlaceholder="Search by message, app, screen or person…"
      toolbar={
        <LogsToolbar
          filters={filters}
          onChange={setFilters}
          onCopyOpenErrors={() => actions.copyOpenErrors(source)}
          copying={actions.copying}
        />
      }
      extraDialogs={
        <LogDetailDialog row={viewing} actions={actions} onClose={() => setViewing(null)} />
      }
    />
  );
}
