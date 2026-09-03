import type { ColDef } from 'ag-grid-community';
import { actionsColumn, boolColumn, textColumn, type DatedCrudGridContext } from '@exyconn/crud';
import type { ListTeamsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedTeamRow = ListTeamsPagedQuery['listTeamsPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type TeamGridContext = DatedCrudGridContext<PagedTeamRow>;

/** Column model for the server-side Teams grid. */
export const TEAM_COLUMNS: ColDef<PagedTeamRow>[] = [
  textColumn('name', 'Team'),
  textColumn('department', 'Department'),
  boolColumn('active', 'Active'),
  actionsColumn(),
];
