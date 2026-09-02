import { Box } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useCrudDialog } from '@exyconn/shell/hooks/useCrudDialog';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useListPositionsQuery, useDeletePositionMutation } from '@exyconn/shell/graphql/generated';
import { PositionForm, type PositionRow } from './forms/position';

/** HR Positions — manage the designations reused on employee records. */
export function PositionsPage() {
  const { data, loading, refetch } = useListPositionsQuery({ fetchPolicy: 'cache-and-network' });
  const [deletePosition] = useDeletePositionMutation();
  const dialog = useCrudDialog<PositionRow>();
  const confirm = useConfirm();
  const notify = useNotify();

  const rows = data?.listPositions ?? [];

  const columns: Column<PositionRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'department', label: 'Department' },
    { key: 'description', label: 'Description', render: (r) => r.description ?? '—' },
  ];

  const handleDelete = async (row: PositionRow) => {
    const ok = await confirm({ message: `Delete position "${row.name}"?`, confirmText: 'Delete' });
    if (!ok) return;
    await deletePosition({ variables: { id: row.id } });
    await refetch();
    notify('Position deleted');
  };

  return (
    <Box>
      <PageHeader
        title="Positions"
        subtitle="Job titles used when assigning employees"
        actionLabel="New position"
        onAction={dialog.openCreate}
      />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          onEdit={dialog.openEdit}
          onDelete={handleDelete}
          emptyMessage={loading ? 'Loading…' : 'No positions yet.'}
        />
      </Box>
      <CrudDialog
        open={dialog.open}
        title={dialog.editing ? 'Edit position' : 'New position'}
        onClose={dialog.close}
      >
        <PositionForm
          initial={dialog.editing}
          onCancel={dialog.close}
          onDone={() => {
            void refetch();
            dialog.close();
          }}
        />
      </CrudDialog>
    </Box>
  );
}
