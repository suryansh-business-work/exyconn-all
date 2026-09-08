import type { ColDef } from 'ag-grid-community';
import GroupIcon from '@mui/icons-material/Group';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  derivedColumn,
  statusColumn,
  textColumn,
  type CrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListAudienceListsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedAudienceRow =
  ListAudienceListsPagedQuery['listAudienceListsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type AudiencesGridContext = CrudGridContext<PagedAudienceRow>;

const MEMBERS_ACTION: RowActionSpec = {
  key: 'members',
  label: 'view members',
  icon: GroupIcon,
  color: 'primary',
};

/**
 * Column model for the server-side audience grid.
 *
 * "Named" is deliberately not called a recipient count: with a segment rule the real
 * number is only knowable by resolving it, which the Members drawer does.
 */
export const AUDIENCE_COLUMNS: ColDef<PagedAudienceRow>[] = [
  textColumn('name', 'Audience'),
  textColumn('description', 'Description'),
  derivedColumn<PagedAudienceRow>('named', 'Named', (row) =>
    String(row.clientIds.length + row.contactIds.length),
  ),
  statusColumn('dynamicSegment', 'Segment'),
  actionsColumn([MEMBERS_ACTION, EDIT_ACTION, DELETE_ACTION], 130),
];
