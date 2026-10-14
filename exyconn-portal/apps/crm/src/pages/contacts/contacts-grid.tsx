import type { ColDef } from 'ag-grid-community';
import { actionsColumn, statusColumn, textColumn, type CrudGridContext } from '@exyconn/crud';
import type { ListContactsPagedQuery } from '@exyconn/shell/graphql/generated';
import { emailColumn, type EmailCheckContext } from '../../email-verification';

export type PagedContactRow = ListContactsPagedQuery['listContactsPaged']['rows'][number];
export type ContactsGridContext = CrudGridContext<PagedContactRow> & EmailCheckContext;

/** Column model for the server-side Contacts grid. */
export const CONTACT_COLUMNS: ColDef<PagedContactRow>[] = [
  textColumn('name', 'Contact'),
  textColumn('title', 'Title'),
  textColumn('companyName', 'Company'),
  emailColumn<PagedContactRow>(),
  textColumn('phone', 'Phone'),
  statusColumn('status', 'Status'),
  textColumn('owner', 'Owner'),
  actionsColumn(),
];
