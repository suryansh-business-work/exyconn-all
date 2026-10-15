import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import AddIcon from '@mui/icons-material/Add';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useProjectWorkflowsQuery,
  type ProjectWorkflowSummaryFragment,
} from '@exyconn/shell/graphql/generated';
import { WorkflowForm } from './forms/workflow';
import { useWorkflowMutations } from './useWorkflowMutations';

const editorPath = (id: string) => `/projects/workflows/${id}`;

/** The list's columns. Built as a function so the date format follows the settings. */
function workflowColumns(
  formatDateTime: (value: string) => string,
): Column<ProjectWorkflowSummaryFragment>[] {
  return [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'updatedByName', label: 'Last changed by' },
    { key: 'updatedAt', label: 'Updated', render: (row) => formatDateTime(row.updatedAt) },
  ];
}

/**
 * Tools > Workflows: every custom workflow the company has drawn. Creating one opens the
 * designer straight away, on a Start already joined to an End.
 */
export function WorkflowsPage() {
  const t = useT();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { formatDateTime } = useSettings();
  const { data, loading, error, refetch } = useProjectWorkflowsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const { create, remove } = useWorkflowMutations();
  const [creating, setCreating] = useState(false);

  const destroy = async (row: ProjectWorkflowSummaryFragment) => {
    const ok = await confirm({
      message: 'Delete the workflow "{name}"?',
      messageValues: { name: row.name },
      confirmText: 'Delete',
    });
    if (ok) {
      await remove(row.id);
    }
  };

  return (
    <Box>
      <Flex direction="row" alignItems="center" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Heading level={4}>{t('Workflows')}</Heading>
          <Text size="sm" color="text.secondary">
            {t('Draw how work moves: the steps, the decisions, and where it ends.')}
          </Text>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>
          {t('New workflow')}
        </Button>
      </Flex>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage(error, 'Could not load the workflows')}
        </Alert>
      ) : null}

      <DataTable
        columns={workflowColumns(formatDateTime)}
        rows={data?.projectWorkflows ?? []}
        onRowClick={(row) => navigate(editorPath(row.id))}
        onDelete={destroy}
        emptyMessage="No workflows yet. Create one to start drawing."
        loading={loading && !data}
        onRefresh={refetch}
      />

      <CrudDialog open={creating} title={t('New workflow')} onClose={() => setCreating(false)}>
        <WorkflowForm
          initial={null}
          onSubmit={async (details) => {
            const id = await create(details);
            if (id) {
              navigate(editorPath(id));
            }
          }}
          onCancel={() => setCreating(false)}
        />
      </CrudDialog>
    </Box>
  );
}
