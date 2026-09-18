import type { ColDef } from 'ag-grid-community';
import TimelineIcon from '@mui/icons-material/Timeline';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  dateColumn,
  derivedColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListItIncidentsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedIncidentRow = ListItIncidentsPagedQuery['listItIncidentsPaged']['rows'][number];

export type IncidentsGridContext = DatedCrudGridContext<PagedIncidentRow>;

const TIMELINE_ACTION: RowActionSpec = {
  key: 'timeline',
  label: 'timeline and updates',
  icon: TimelineIcon,
  color: 'primary',
};

/** Column model for the incident register. */
export const INCIDENT_COLUMNS: ColDef<PagedIncidentRow>[] = [
  textColumn('title', 'Incident'),
  statusColumn('severity', 'Severity'),
  statusColumn('category', 'Category'),
  statusColumn('status', 'Status'),
  dateColumn('startedAt', 'Started'),
  dateColumn('resolvedAt', 'Resolved', '—'),
  derivedColumn('followUps', 'Actions open', (row) =>
    String(row.followUps.filter((followUp) => !followUp.done).length),
  ),
  actionsColumn([TIMELINE_ACTION, EDIT_ACTION, DELETE_ACTION]),
];
