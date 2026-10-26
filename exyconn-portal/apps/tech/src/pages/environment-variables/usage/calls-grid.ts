import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { derivedStatusColumn, textColumn, valueColumn } from '@exyconn/crud';
import type { ListIntegrationCallsPagedQuery } from '@exyconn/shell/graphql/generated';
import { USAGE_PROVIDERS } from './usage.providers';

export type IntegrationCallRow =
  ListIntegrationCallsPagedQuery['listIntegrationCallsPaged']['rows'][number];

/** The viewer's own date-time and US-dollar formatting, read off the grid context. */
export interface CallsGridContext {
  formatDateTime: (value: string) => string;
  formatUsd: (value: number) => string;
}

const ctxOf = (params: ValueFormatterParams<IntegrationCallRow>) =>
  params.context as CallsGridContext;

const whenColumn: ColDef<IntegrationCallRow> = {
  field: 'createdAt',
  headerName: 'When',
  width: 190,
  valueFormatter: (params) =>
    params.data ? ctxOf(params).formatDateTime(params.data.createdAt) : '',
  filter: false,
  floatingFilter: false,
};

const costColumn: ColDef<IntegrationCallRow> = {
  field: 'costUsd',
  headerName: 'Cost (USD)',
  width: 130,
  valueFormatter: (params) => {
    const cost = params.data?.costUsd;
    return cost == null ? '—' : ctxOf(params).formatUsd(cost);
  },
  filter: false,
  floatingFilter: false,
};

/** Every call made with an Environment Variables credential. Text columns filter on the server. */
export const CALL_COLUMNS: ColDef<IntegrationCallRow>[] = [
  whenColumn,
  textColumn('provider', 'Service', (row) => USAGE_PROVIDERS[row.provider].label),
  { ...textColumn('action', 'Call'), flex: 1, minWidth: 220 },
  derivedStatusColumn('result', 'Result', (row) => (row.ok ? 'SUCCEEDED' : 'FAILED')),
  valueColumn('durationMs', 'Time (ms)', (row) => String(row.durationMs)),
  valueColumn('inputTokens', 'Tokens in/out', (row) =>
    row.inputTokens || row.outputTokens ? `${row.inputTokens} / ${row.outputTokens}` : '—',
  ),
  costColumn,
  textColumn('actorEmail', 'Who', (row) => row.actorEmail || '—'),
  textColumn('source', 'From'),
  textColumn('error', 'Error', (row) => row.error || '—'),
];
