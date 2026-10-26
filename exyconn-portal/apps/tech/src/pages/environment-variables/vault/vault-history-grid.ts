import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  actionsColumn,
  statusColumn,
  textColumn,
  type CrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { TechVaultSessionsPagedQuery } from '@exyconn/shell/graphql/generated';

export type VaultSessionRow = TechVaultSessionsPagedQuery['techVaultSessionsPaged']['rows'][number];

/** Row handlers plus the date-time formatter the time columns read off the context. */
export interface VaultHistoryContext extends CrudGridContext<VaultSessionRow> {
  formatDateTime: (value: string) => string;
}

const DETAILS: RowActionSpec = { key: 'details', label: 'view session', icon: InfoOutlinedIcon };

const timeColumn = (
  field: 'unlockedAt' | 'expiresAt',
  headerName: string,
): ColDef<VaultSessionRow> => ({
  field,
  headerName,
  width: 190,
  valueFormatter: (params: ValueFormatterParams<VaultSessionRow>) =>
    params.data ? (params.context as VaultHistoryContext).formatDateTime(params.data[field]) : '',
  filter: false,
  floatingFilter: false,
});

/** Where the device was, as latitude and longitude; or why that is not known. */
export const locationText = (row: VaultSessionRow): string => {
  const { state, latitude, longitude } = row.location;
  if (state === 'GRANTED' && latitude != null && longitude != null) {
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
  return state === 'DENIED' ? 'Refused by the browser' : 'Not available';
};

/** How the session stands: still open, locked by hand or run out. */
const statusOf = (row: VaultSessionRow) => row.endReason ?? 'ACTIVE';

export const VAULT_HISTORY_COLUMNS: ColDef<VaultSessionRow>[] = [
  timeColumn('unlockedAt', 'Unlocked'),
  textColumn('userName', 'Who', (row) => row.userName || row.email),
  { ...textColumn('reason', 'Why'), flex: 1, minWidth: 220 },
  textColumn('ip', 'IP address'),
  textColumn('userAgent', 'Browser'),
  statusColumn('endReason', 'Status', statusOf),
  timeColumn('expiresAt', 'Locks at'),
  actionsColumn([DETAILS]),
];
