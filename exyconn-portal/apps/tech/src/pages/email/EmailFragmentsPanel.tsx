import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ServerDataGrid } from '@exyconn/shell/components/data/ServerDataGrid';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { Box } from '@exyconn/shell/components/ui';
import { useCrudResource, usePagedFetcher } from '@exyconn/crud';
import {
  useDeleteEmailFragmentMutation,
  ListEmailFragmentsPagedDocument,
  type ListEmailFragmentsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { EmailFragmentForm, type EmailFragmentRow } from './forms/email-fragment';
import { FRAGMENT_COLUMNS, type PagedFragmentRow, type FragmentGridContext } from './email-grids';

/**
 * Tech → Email → Fragments: the shared pieces every template pulls in.
 *
 * Fragments exist so a brand change is one edit rather than one edit per template — which is
 * also why deleting one is worse than it looks: every template that includes it stops
 * rendering, and stops sending.
 */
export function EmailFragmentsPanel() {
  const [deleteFragment] = useDeleteEmailFragmentMutation();

  const crud = useCrudResource<EmailFragmentRow, PagedFragmentRow>({
    label: 'Fragment',
    onDelete: (row) => deleteFragment({ variables: { id: row.id } }),
    confirmMessage: (row) =>
      `Delete "${row.name}"? Every template that includes {{> ${row.key} }} will stop sending.`,
  });
  const fetchRows = usePagedFetcher(
    ListEmailFragmentsPagedDocument,
    (data: ListEmailFragmentsPagedQuery) => data.listEmailFragmentsPaged,
  );

  const context: FragmentGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate: (value: string) => value,
  };

  return (
    <Box>
      <PageHeader
        title="Fragments"
        subtitle="Shared MJML every template can include"
        actionLabel="New fragment"
        onAction={crud.openCreate}
      />
      <ServerDataGrid
        columnDefs={FRAGMENT_COLUMNS}
        fetchRows={fetchRows}
        context={context}
        refreshSignal={crud.refreshSignal}
        searchPlaceholder="Search by key, name or description…"
      />
      <CrudDialog
        open={crud.open}
        title={`${crud.editing ? 'Edit' : 'New'} fragment`}
        onClose={crud.close}
      >
        <EmailFragmentForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudDialog>
    </Box>
  );
}
