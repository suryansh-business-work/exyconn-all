import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListHolidaysPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedHolidayRow = ListHolidaysPagedQuery['listHolidaysPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type HolidayGridContext = DatedCrudGridContext<PagedHolidayRow>;

/** Column model for the server-side Holidays grid. */
export const HOLIDAY_COLUMNS: ColDef<PagedHolidayRow>[] = [
  textColumn('name', 'Holiday'),
  dateColumn('date', 'Date'),
  statusColumn('type', 'Type'),
  textColumn('description', 'Description'),
  actionsColumn(),
];
