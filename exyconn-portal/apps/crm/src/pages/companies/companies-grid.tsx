import type { ColDef } from 'ag-grid-community';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  boolColumn,
  statusColumn,
  textColumn,
  type CrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListCompaniesPagedQuery } from '@exyconn/shell/graphql/generated';
import { CompanyNameCell } from './CompanyNameCell';

export type PagedCompanyRow = ListCompaniesPagedQuery['listCompaniesPaged']['rows'][number];
export type CompaniesGridContext = CrudGridContext<PagedCompanyRow>;

/** Makes an Admin client of the account — gone once it has one. */
const MAKE_CLIENT_ACTION: RowActionSpec = {
  key: 'makeClient',
  label: 'make client',
  icon: PersonAddAltIcon,
  color: 'primary',
  hidden: (row: PagedCompanyRow) => row.isClient,
};

/** Column model for the server-side Companies grid. */
export const COMPANY_COLUMNS: ColDef<PagedCompanyRow>[] = [
  { ...textColumn<PagedCompanyRow>('name', 'Company'), cellRenderer: CompanyNameCell },
  textColumn('domain', 'Domain'),
  textColumn('industry', 'Industry'),
  textColumn('size', 'Size'),
  statusColumn('status', 'Status'),
  boolColumn('isClient', 'Client'),
  textColumn('owner', 'Company owner'),
  textColumn('leadOwner', 'Lead owner'),
  textColumn('tags', 'Tags'),
  actionsColumn([MAKE_CLIENT_ACTION, EDIT_ACTION, DELETE_ACTION]),
];
