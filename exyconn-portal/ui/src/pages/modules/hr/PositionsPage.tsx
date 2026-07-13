import { Box } from '@/components/ui';
import { DataTable, type Column } from '../../../components/data/DataTable';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { PageHeader } from '../../../components/layout/PageHeader';
import { glass } from '../../../components/glass/glass';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useListPositionsQuery, useDeletePositionMutation } from '../../../graphql/generated';
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
