import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  statusColumn,
  textColumn,
  type CrudGridContext,
} from '@exyconn/crud';
import type { ClientCommunicationRow } from '../forms/client-communication';

export interface CommunicationsGridContext extends CrudGridContext<ClientCommunicationRow> {
  /** Date and time in the viewer's own settings — a call's hour matters, not just its day. */
  formatDateTime: (value: string) => string;
}

const whenColumn: ColDef<ClientCommunicationRow> = {
  field: 'occurredAt',
  headerName: 'When',
  width: 190,
  valueFormatter: (params: ValueFormatterParams<ClientCommunicationRow>) =>
    params.data
      ? (params.context as CommunicationsGridContext).formatDateTime(params.data.occurredAt)
      : '',
  filter: false,
  floatingFilter: false,
};

/** A client's communication log, newest conversation first. */
export const COMMUNICATION_COLUMNS: ColDef<ClientCommunicationRow>[] = [
  whenColumn,
  statusColumn('type', 'Type'),
  textColumn('subject', 'Subject'),
  textColumn('participants', 'Who'),
  { ...textColumn('summary', 'Summary'), flex: 1, minWidth: 240 },
  textColumn('loggedByName', 'Logged by'),
  actionsColumn([EDIT_ACTION, DELETE_ACTION]),
];
