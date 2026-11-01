import type { ColDef } from 'ag-grid-community';
import KeyIcon from '@mui/icons-material/Key';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  emailColumn,
  statusColumn,
  textColumn,
  type CrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListSuppliersPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedSupplierRow = ListSuppliersPagedQuery['listSuppliersPaged']['rows'][number];
export type SuppliersGridContext = CrudGridContext<PagedSupplierRow>;

/** Who at the supplier may sign in to the vendor portal (vendors.exyconn.com). */
export const VENDOR_ACCESS_ACTION: RowActionSpec = {
  key: 'vendorAccess',
  label: 'vendor portal access',
  icon: KeyIcon,
  color: 'primary',
};

/** Column model for the server-side Suppliers grid. */
export const SUPPLIER_COLUMNS: ColDef<PagedSupplierRow>[] = [
  textColumn('code', 'Code'),
  textColumn('name', 'Supplier'),
  textColumn('contactName', 'Contact'),
  emailColumn('email', 'Email'),
  textColumn('phone', 'Phone'),
  statusColumn('status', 'Status'),
  actionsColumn([VENDOR_ACCESS_ACTION, EDIT_ACTION, DELETE_ACTION]),
];
