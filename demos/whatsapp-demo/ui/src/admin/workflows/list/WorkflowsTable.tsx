import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormatters } from '@exyconn/i18n';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { DataTable, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useDeleteWhatsappWorkflowMutation,
  useDuplicateWhatsappWorkflowMutation,
} from '@exyconn/shell/graphql/generated';
import { WORKFLOW_QUERIES, editorPath, type WorkflowRow } from '../model/api';
import { workflowColumns } from './workflow-columns';

interface WorkflowsTableProps {
  rows: WorkflowRow[];
  loading: boolean;
  onRefresh: () => Promise<unknown>;
}

/** The selected demo's workflows: open in the editor, duplicate as a draft, or delete. */
export function WorkflowsTable({ rows, loading, onRefresh }: Readonly<WorkflowsTableProps>) {
  const navigate = useNavigate();
  const notify = useNotify();
  const confirm = useConfirm();
  const { formatDateTime } = useFormatters();
  const columns = useMemo(() => workflowColumns(formatDateTime), [formatDateTime]);
  const [duplicate] = useDuplicateWhatsappWorkflowMutation({ refetchQueries: WORKFLOW_QUERIES });
  const [remove] = useDeleteWhatsappWorkflowMutation({
    refetchQueries: WORKFLOW_QUERIES,
    update: (cache, _result, { variables }) => {
      if (variables) {
        cache.evict({ id: cache.identify({ __typename: 'WhatsappWorkflow', id: variables.id }) });
        cache.gc();
      }
    },
  });

  const open = (row: WorkflowRow) => navigate(editorPath(row.id));

  const onDuplicate = async (row: WorkflowRow) => {
    try {
      const result = await duplicate({ variables: { id: row.id } });
      const copy = result.data?.duplicateWhatsappWorkflow;
      if (copy) {
        notify('Copied as "{key}"', 'success', { key: copy.key });
      }
    } catch (error) {
      console.error('Could not duplicate the workflow', error);
      notify(errorMessage(error, 'Could not duplicate the workflow'), 'error');
    }
  };

  const onDelete = async (row: WorkflowRow) => {
    const ok = await confirm({
      title: 'Delete workflow',
      message: 'Delete "{name}"? Jump nodes that start it will stop working.',
      messageValues: { name: row.name },
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) {
      return;
    }
    try {
      await remove({ variables: { id: row.id } });
      notify('Workflow deleted', 'success');
    } catch (error) {
      console.error('Could not delete the workflow', error);
      notify(errorMessage(error, 'Could not delete the workflow'), 'error');
    }
  };

  const actions: RowAction<WorkflowRow>[] = [
    {
      icon: <OpenInNewIcon fontSize="small" />,
      tooltip: 'Open in the editor',
      ariaLabel: 'open workflow',
      color: 'primary',
      onClick: open,
    },
    {
      icon: <ContentCopyIcon fontSize="small" />,
      tooltip: 'Duplicate as a draft',
      ariaLabel: 'duplicate workflow',
      onClick: (row) => {
        onDuplicate(row).catch((error: unknown) => console.error(error));
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      actions={actions}
      onRowClick={open}
      onDelete={(row) => {
        onDelete(row).catch((error: unknown) => console.error(error));
      }}
      emptyMessage="No workflows in this demo yet."
      loading={loading}
      onRefresh={onRefresh}
    />
  );
}
