import type { ColDef } from 'ag-grid-community';
import { actionsColumn, statusColumn, textColumn, type CrudGridContext } from '@exyconn/crud';
import type { ListSuppliersPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedSupplierRow = ListSuppliersPagedQuery['listSuppliersPaged']['rows'][number];
export type SuppliersGridContext = CrudGridContext<PagedSupplierRow>;

/** Column model for the server-side Suppliers grid. */
export const SUPPLIER_COLUMNS: ColDef<PagedSupplierRow>[] = [
  textColumn('code', 'Code'),
  textColumn('name', 'Supplier'),
  textColumn('contactName', 'Contact'),
  textColumn('email', 'Email'),
  textColumn('phone', 'Phone'),
  statusColumn('status', 'Status'),
  actionsColumn(),
];
