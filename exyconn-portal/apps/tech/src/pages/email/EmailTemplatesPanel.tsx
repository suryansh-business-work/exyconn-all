import { useState } from 'react';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ServerDataGrid } from '@exyconn/shell/components/data/ServerDataGrid';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { Box } from '@exyconn/shell/components/ui';
import { useCrudResource, usePagedFetcher } from '@exyconn/crud';
import {
  useDeleteEmailTemplateMutation,
  ListEmailTemplatesPagedDocument,
  type ListEmailTemplatesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { EmailTemplateForm, type EmailTemplateRow } from './forms/email-template';
import { EmailPreviewDialog } from './EmailPreviewDialog';
import { TEMPLATE_COLUMNS, type PagedTemplateRow, type EmailGridContext } from './email-grids';

/** Tech → Email → Templates: the transactional emails, authored here rather than deployed. */
export function EmailTemplatesPanel() {
  const [deleteTemplate] = useDeleteEmailTemplateMutation();
  const [previewing, setPreviewing] = useState<PagedTemplateRow | null>(null);

  const crud = useCrudResource<EmailTemplateRow, PagedTemplateRow>({
    label: 'Template',
    onDelete: (row) => deleteTemplate({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete the "${row.name}" template? Anything sending it will fail.`,
  });
  const fetchRows = usePagedFetcher(
    ListEmailTemplatesPagedDocument,
    (data: ListEmailTemplatesPagedQuery) => data.listEmailTemplatesPaged,
  );

  const context: EmailGridContext = {
    actions: { preview: setPreviewing, edit: crud.openEdit, delete: crud.remove },
    formatDate: (value: string) => value,
  };

  return (
    <Box>
      <PageHeader
        title="Templates"
        subtitle="Change what an email says without a deploy"
        actionLabel="New template"
        onAction={crud.openCreate}
      />
      <ServerDataGrid
        columnDefs={TEMPLATE_COLUMNS}
        fetchRows={fetchRows}
        context={context}
        refreshSignal={crud.refreshSignal}
        searchPlaceholder="Search by key, name or subject…"
      />
      <CrudDialog
        open={crud.open}
        title={`${crud.editing ? 'Edit' : 'New'} template`}
        onClose={crud.close}
      >
        <EmailTemplateForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudDialog>
      <EmailPreviewDialog template={previewing} onClose={() => setPreviewing(null)} />
    </Box>
  );
}
