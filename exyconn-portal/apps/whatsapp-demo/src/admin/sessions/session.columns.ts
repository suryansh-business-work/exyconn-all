import { derivedColumn, statusColumn, valueColumn } from '@exyconn/crud';
import type { GridTranslate } from '@exyconn/shell/components/data/gridContext';
import type { ServerDataGridProps } from '@exyconn/shell/components/data/ServerDataGrid.types';
import type { WhatsappDemoSessionsQuery } from '@exyconn/shell/graphql/generated';
import { formatDemoDuration } from '../shared/duration';

export type SessionRow = WhatsappDemoSessionsQuery['whatsappDemoSessions']['rows'][number];
type SessionColumn = ServerDataGridProps<SessionRow>['columnDefs'][number];

/** What this grid puts on ag-grid's context beyond the shared translator. */
export interface SessionGridContext {
  formatDateTime: (iso: string) => string;
  industryName: (demoKey: string) => string;
}

function sessionContext(context: unknown): SessionGridContext {
  return context as SessionGridContext;
}

/** The device kinds the chat reports, as people say them. */
const DEVICE_LABELS: Readonly<Record<string, string>> = {
  phone: 'Phone',
  tablet: 'Tablet',
  desktop: 'Desktop',
};

/** A session's device in words; an unrecorded one is a dash, not a blank. */
export function deviceLabel(device: string | null | undefined, t: GridTranslate): string {
  if (!device) {
    return '—';
  }
  return t(DEVICE_LABELS[device] ?? device);
}

/** Columns the server neither sorts nor filters on carry no floating filter. */
const NO_FILTER = { filter: false, floatingFilter: false } as const;

/**
 * The session log. Newest first by default; the user column is matched by the grid's search
 * box (name or email), and industry/status by the filters above the grid.
 */
export const SESSION_COLUMNS: SessionColumn[] = [
  derivedColumn<SessionRow>('user', 'User', (row) => `${row.userName} · ${row.userEmail}`),
  {
    field: 'startedAt',
    headerName: 'Started',
    sort: 'desc',
    ...NO_FILTER,
    valueFormatter: (params) =>
      params.data ? sessionContext(params.context).formatDateTime(params.data.startedAt) : '',
  },
  valueColumn<SessionRow>('durationMs', 'Duration', (row) => formatDemoDuration(row.durationMs)),
  valueColumn<SessionRow>('device', 'Device', (row, t) => deviceLabel(row.device, t)),
  {
    colId: 'demos',
    headerName: 'Industries opened',
    sortable: false,
    ...NO_FILTER,
    valueGetter: (params) => {
      if (!params.data) {
        return '';
      }
      const { industryName } = sessionContext(params.context);
      return params.data.demos.map((demoKey) => industryName(demoKey)).join(', ');
    },
  },
  valueColumn<SessionRow>('flowsStarted', 'Flows started', (row) => String(row.flowsStarted)),
  valueColumn<SessionRow>('flowsCompleted', 'Flows completed', (row) => String(row.flowsCompleted)),
  valueColumn<SessionRow>('events', 'Events', (row) => String(row.events)),
  statusColumn<SessionRow>('status', 'Status'),
];
