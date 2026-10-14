import { useMemo, useState } from 'react';
import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Stack } from '@exyconn/shell/components/ui';
import { ServerDataGrid } from '@exyconn/shell/components/data/ServerDataGrid';
import { densePanel } from '@exyconn/shell/components/glass/glass';
import { usePageTitle } from '@exyconn/shell/components/layout/usePageTitle';
import { FilterOp, type TableFilterInput } from '@exyconn/shell/graphql/generated';
import { DateRangeFilter } from '../shared/DateRangeFilter';
import { useDateRange } from '../shared/useDateRange';
import { useIndustries } from '../shared/useIndustries';
import { SessionDrawer } from './detail';
import { ANY, SessionFilters, type SessionFilterValues } from './SessionFilters';
import { SESSION_COLUMNS, type SessionGridContext, type SessionRow } from './session.columns';
import { useSessionFetcher } from './useSessionFetcher';

/**
 * The industry and status selects as server filters. `demos` matches a session that opened
 * that industry; `status` is "active" or "ended".
 */
function toFilters(values: SessionFilterValues): TableFilterInput[] {
  const filters: TableFilterInput[] = [];
  if (values.industry !== ANY) {
    filters.push({ field: 'demos', op: FilterOp.Equals, value: values.industry });
  }
  if (values.status !== ANY) {
    filters.push({ field: 'status', op: FilterOp.Equals, value: values.status });
  }
  return filters;
}

/**
 * Sessions: every demo session in the period, server-paged, newest first. A row opens the
 * session's event log in a drawer, where it can be replayed step by step.
 */
export function SessionsTab() {
  const t = useT();
  usePageTitle(t('WhatsApp demo sessions'));
  const { formatDateTime } = useFormatters();
  const { range, variables, preset, setRange } = useDateRange();
  const { options, industryName } = useIndustries();
  const [filters, setFilters] = useState<SessionFilterValues>({ industry: ANY, status: ANY });
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);

  const { fetchRows, refreshSignal } = useSessionFetcher({
    ...variables,
    filters: toFilters(filters),
  });
  const context = useMemo<SessionGridContext>(
    () => ({ formatDateTime, industryName }),
    [formatDateTime, industryName],
  );

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={1.5}
        sx={{ justifyContent: 'space-between' }}
      >
        <DateRangeFilter range={range} preset={preset} onChange={setRange} />
        <SessionFilters values={filters} industries={options} onChange={setFilters} />
      </Stack>
      <Box sx={densePanel}>
        <ServerDataGrid<SessionRow>
          columnDefs={SESSION_COLUMNS}
          fetchRows={fetchRows}
          context={context}
          refreshSignal={refreshSignal}
          onRowClick={(row) => setOpenSessionId(row.sessionId)}
          searchPlaceholder="Search by name or email…"
        />
      </Box>
      <SessionDrawer sessionId={openSessionId} onClose={() => setOpenSessionId(null)} />
    </Stack>
  );
}
