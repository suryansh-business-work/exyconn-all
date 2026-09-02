import type { ColDef } from 'ag-grid-community';
import { actionsColumn, boolColumn, textColumn, type DatedCrudGridContext } from '@exyconn/crud';
import type { ListLocationsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedLocationRow = ListLocationsPagedQuery['listLocationsPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type LocationGridContext = DatedCrudGridContext<PagedLocationRow>;

/** Column model for the server-side Locations grid. */
export const LOCATION_COLUMNS: ColDef<PagedLocationRow>[] = [
  textColumn('name', 'Location'),
  textColumn('code', 'Code'),
  textColumn('city', 'City'),
  textColumn('timezone', 'Timezone'),
  boolColumn('active', 'Active'),
  actionsColumn(),
];
