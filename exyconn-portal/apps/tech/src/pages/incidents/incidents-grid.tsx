import type { ColDef } from 'ag-grid-community';
import PostAddIcon from '@mui/icons-material/PostAdd';
import {
  DELETE_ACTION,
  actionsColumn,
  dateColumn,
  derivedStatusColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListStatusIncidentsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedIncidentRow =
  ListStatusIncidentsPagedQuery['listStatusIncidentsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type IncidentsGridContext = DatedCrudGridContext<PagedIncidentRow>;

const UPDATE_ACTION: RowActionSpec = {
  key: 'update',
  label: 'post update',
  icon: PostAddIcon,
  color: 'primary',
};

/** Column model for the incident log. Title and service are what Tech searches by. */
export const INCIDENT_COLUMNS: ColDef<PagedIncidentRow>[] = [
  textColumn('title', 'Incident'),
  textColumn('serviceName', 'Service'),
  statusColumn('impact', 'Impact'),
  statusColumn('source', 'Source'),
  derivedStatusColumn('progress', 'Progress', (row) => (row.resolvedAt ? 'RESOLVED' : 'OPEN')),
  valueColumn('updates', 'Updates', (row) => String(row.updates.length)),
  dateColumn('startedAt', 'Started'),
  dateColumn('resolvedAt', 'Resolved', 'Ongoing'),
  actionsColumn([UPDATE_ACTION, DELETE_ACTION]),
];
