import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import {
  actionsColumn,
  statusColumn,
  textColumn,
  type CrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import type { ClientHubCommunicationsQuery } from '@exyconn/shell/graphql/generated';

export type HubCommunicationRow =
  ClientHubCommunicationsQuery['clientHubCommunications']['rows'][number];

export interface HubCommunicationsContext extends CrudGridContext<HubCommunicationRow> {
  formatDateTime: (value: string) => string;
}

const OPEN_ACTION: RowActionSpec = {
  key: 'open',
  label: 'read the whole entry',
  icon: VisibilityIcon,
  color: 'primary',
};

const whenColumn: ColDef<HubCommunicationRow> = {
  field: 'occurredAt',
  headerName: 'When',
  width: 190,
  valueFormatter: (params: ValueFormatterParams<HubCommunicationRow>) =>
    params.data
      ? (params.context as HubCommunicationsContext).formatDateTime(params.data.occurredAt)
      : '',
  filter: false,
  floatingFilter: false,
};

/** The client's communication log, newest conversation first. */
export const HUB_COMMUNICATION_COLUMNS: ColDef<HubCommunicationRow>[] = [
  whenColumn,
  statusColumn('type', 'Type'),
  textColumn('subject', 'Subject'),
  textColumn('participants', 'Who'),
  { ...textColumn('summary', 'Summary'), flex: 1, minWidth: 240 },
  actionsColumn([OPEN_ACTION]),
];
