import { CrudDashboard, useCrudResource } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  CrmObject,
  useListContactsStatsQuery,
  useDeleteContactMutation,
  SearchContactsDocument,
  type SearchContactsQuery,
} from '@exyconn/shell/graphql/generated';
import { ContactForm, type ContactRow } from './forms/contact';
import { CONTACT_COLUMNS, type PagedContactRow, type ContactsGridContext } from './contacts-grid';
import { useEmailCheck } from '../../email-verification';
import { color } from '@exyconn/shell/components/ui';
import { RecordListToolbar, useRecordList, withRefreshSignal } from '../../records/list';
import { RowClickGuard } from '../../records/list/RowClickGuard';
import { RecordActions } from '../../records/RecordActions';
import { usePreviewParam } from '../../records/quick-view';
import { ContactQuickView } from './ContactQuickView';

/** CRM → Contacts: the people at the accounts, and who owns each relationship. */
export function ContactsPage() {
  const { previewId, openPreview, closePreview } = usePreviewParam();
  const {
    data: statsData,
    loading: statsLoading,
    refetch: refetchStats,
  } = useListContactsStatsQuery();
  const [deleteContact] = useDeleteContactMutation();
  const crud = useCrudResource<ContactRow, PagedContactRow>({
    label: 'Contact',
    onDelete: (row) => deleteContact({ variables: { id: row.id } }),
    confirmMessage: (row) => ({ message: 'Delete contact "{name}"?', values: { name: row.name } }),
    refetch: refetchStats,
  });
  // Filters, sorts, columns and saved views: the HubSpot-style list over the search query.
  const records = useRecordList({
    object: CrmObject.Contact,
    document: SearchContactsDocument,
    select: (data: SearchContactsQuery) => data.searchContacts,
    columns: CONTACT_COLUMNS,
  });

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

  const verifyEmail = useEmailCheck(crud.reload);
  const gridContext: ContactsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    verifyEmail,
  };

  return (
    <RowClickGuard>
      <CrudDashboard
        key={records.gridKey}
        title="Contacts"
        subtitle="People at the accounts"
        entityLabel="contact"
        stats={statItems}
        statsLoading={!statsData && statsLoading}
        crud={withRefreshSignal(crud, records.refreshSignal)}
        renderForm={(initial) => (
          <ContactForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
        )}
        columnDefs={records.columnDefs}
        onRowClick={(row) => openPreview(row.id)}
        fetchRows={records.fetchRows}
        bulkList="searchContacts"
        context={gridContext}
        searchPlaceholder="Search by name, email, company or owner…"
        initialSearch={records.initialSearch}
        extraDialogs={
          <ContactQuickView id={previewId} onClose={closePreview} onSaved={crud.reload} />
        }
        toolbar={
          <RecordListToolbar
            records={records}
            allLabel="All contacts"
            nearby
            renderActions={(query) => (
              <RecordActions
                object={CrmObject.Contact}
                query={query}
                fileName="contacts"
                onImported={crud.reload}
              />
            )}
          />
        }
      />
    </RowClickGuard>
  );
}
