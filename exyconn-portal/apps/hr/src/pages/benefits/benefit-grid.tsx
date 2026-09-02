import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListBenefitsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedBenefitRow = ListBenefitsPagedQuery['listBenefitsPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type BenefitGridContext = DatedCrudGridContext<PagedBenefitRow>;

/** Column model for the server-side Benefits grid. */
export const BENEFIT_COLUMNS: ColDef<PagedBenefitRow>[] = [
  textColumn('name', 'Benefit'),
  statusColumn('kind', 'Type'),
  textColumn('provider', 'Provider'),
  dateColumn('validTo', 'Valid till'),
  actionsColumn(),
];
