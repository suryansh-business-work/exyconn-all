import type { ColDef } from 'ag-grid-community';
import { actionsColumn, derivedColumn, textColumn, type CrudGridContext } from '@exyconn/crud';
import type { ListAudienceListsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedAudienceRow =
  ListAudienceListsPagedQuery['listAudienceListsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type AudiencesGridContext = CrudGridContext<PagedAudienceRow>;

/** Column model for the server-side audience grid. Name and description hit the filter. */
export const AUDIENCE_COLUMNS: ColDef<PagedAudienceRow>[] = [
  textColumn('name', 'Audience'),
  textColumn('description', 'Description'),
  derivedColumn<PagedAudienceRow>('size', 'Clients', (row) => String(row.clientIds.length)),
  actionsColumn(),
];
