import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  derivedColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import { countryName } from '@exyconn/i18n';
import type { ListHolidaysPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedHolidayRow = ListHolidaysPagedQuery['listHolidaysPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type HolidayGridContext = DatedCrudGridContext<PagedHolidayRow>;

/** Column model for the server-side Holidays grid. */
export const HOLIDAY_COLUMNS: ColDef<PagedHolidayRow>[] = [
  textColumn('name', 'Holiday'),
  dateColumn('date', 'Date'),
  statusColumn('type', 'Type'),
  valueColumn('country', 'Country', (row, t) =>
    row.country ? countryName(row.country) : t('All countries'),
  ),
  derivedColumn('excludedCountries', 'Not observed in', (row) =>
    row.excludedCountries.map((code) => countryName(code)).join(', '),
  ),
  textColumn('description', 'Description'),
  actionsColumn(),
];
