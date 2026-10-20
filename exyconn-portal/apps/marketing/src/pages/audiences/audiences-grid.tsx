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
 * No recipient count here: the real number is only knowable by resolving the audience,
 * which the Members view does with the same code the send uses.
 */
export const AUDIENCE_COLUMNS: ColDef<PagedAudienceRow>[] = [
  textColumn('name', 'Audience'),
  textColumn('description', 'Description'),
  statusColumn('recipientSource', 'Source'),
  statusColumn('emailSelection', 'Addresses'),
  statusColumn('updateMode', 'Updates'),
  derivedColumn<PagedAudienceRow>('rules', 'Conditions', (row) => String(row.conditions.length)),
  actionsColumn([MEMBERS_ACTION, EDIT_ACTION, DELETE_ACTION], 130),
];
