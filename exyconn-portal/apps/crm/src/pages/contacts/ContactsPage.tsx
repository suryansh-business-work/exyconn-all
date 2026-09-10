import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListContactsStatsQuery,
  useDeleteContactMutation,
  ListContactsPagedDocument,
  type ListContactsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ContactForm, type ContactRow } from './forms/contact';
import { CONTACT_COLUMNS, type PagedContactRow, type ContactsGridContext } from './contacts-grid';
import { color } from '@exyconn/shell/components/ui';

/** CRM → Contacts: the people at the accounts, and who owns each relationship. */
export function ContactsPage() {
  const { data: statsData, refetch: refetchStats } = useListContactsStatsQuery();
  const [deleteContact] = useDeleteContactMutation();
  const crud = useCrudResource<ContactRow, PagedContactRow>({
    label: 'Contact',
    onDelete: (row) => deleteContact({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete contact "${row.name}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListContactsPagedDocument,
    (data: ListContactsPagedQuery) => data.listContactsPaged,
  );

  const stats = statsData?.listContactsStats;
  const statItems: StatItem[] = [
    { label: 'Contacts', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Active',
      value: String(statCount(stats, 'status', 'ACTIVE')),
      accent: color.green[500],
    },
    {
      label: 'Unsubscribed',
      value: String(statCount(stats, 'status', 'UNSUBSCRIBED')),
      accent: color.amber[500],
    },
    {
      label: 'Left company',
      value: String(statCount(stats, 'status', 'LEFT_COMPANY')),
      accent: color.red[200],
    },
  ];

  const gridContext: ContactsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Contacts"
      subtitle="People at the accounts"
      entityLabel="contact"
      exportFileName="contacts"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <ContactForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={CONTACT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by name, email, company or owner…"
    />
  );
}
