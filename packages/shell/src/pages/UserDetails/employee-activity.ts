import type { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import type { ApolloClient } from '@apollo/client';
import { createElement } from 'react';
import type { AuditLogRow } from '@/components/audit';
import { StatusChip } from '@/components/data/StatusChip';
import type { GridFetcher, TablePageResult } from '@/components/data/ServerDataGrid';
import {
  ListUserActivityPagedDocument,
  type ListUserActivityPagedQuery,
  type TableQueryInput,
} from '@/graphql/generated';
import { queryData } from '@/utils/queryData';

/** The list the activity grid reads, as the server registered it for filters and sorts. */
export const ACTIVITY_LIST = 'listUserActivityPaged';

/** What the activity grid's cells read off ag-grid's context. */
export interface ActivityGridContext {
  formatDateTime: (value: string) => string;
}

function ActionCell({ data }: Readonly<ICellRendererParams<AuditLogRow>>) {
  return data ? createElement(StatusChip, { value: data.action }) : null;
}

/** When, in which module, what kind of change, and what it was. Module and summary filter. */
export const ACTIVITY_COLUMNS: ColDef<AuditLogRow>[] = [
  {
    field: 'createdAt',
    headerName: 'When',
    width: 190,
    valueFormatter: (params: ValueFormatterParams<AuditLogRow>) =>
      params.data
        ? (params.context as ActivityGridContext).formatDateTime(params.data.createdAt)
        : '',
    filter: false,
    floatingFilter: false,
  },
  { field: 'module', headerName: 'Module', minWidth: 170 },
  {
    field: 'action',
    headerName: 'Action',
    cellRenderer: ActionCell,
    filter: false,
    floatingFilter: false,
  },
  { field: 'summary', headerName: 'Summary', flex: 1, minWidth: 260 },
];

/** Fetches one page of what `userId` did, newest first, for the server-paged grid. */
export function activityFetcher(client: ApolloClient, userId: string): GridFetcher<AuditLogRow> {
  const variablesFor = (input: TableQueryInput) => ({ userId, input });
  const fetchPage = async (input: TableQueryInput): Promise<TablePageResult<AuditLogRow>> => {
    const result = await client.query<ListUserActivityPagedQuery>({
      query: ListUserActivityPagedDocument,
      variables: variablesFor(input),
      fetchPolicy: 'network-only',
    });
    return queryData(result, 'The activity query').listUserActivityPaged;
  };
  return Object.assign(fetchPage, { list: ACTIVITY_LIST, variablesFor });
}
