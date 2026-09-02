import { Box } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useCrudDialog } from '@exyconn/shell/hooks/useCrudDialog';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useListDepartmentsQuery,
  useDeleteDepartmentMutation,
} from '@exyconn/shell/graphql/generated';
import { DepartmentForm, type DepartmentRow } from './forms/department';

/** HR Departments — manage the departments reused on employee records. */
export function DepartmentsPage() {
  const { data, loading, refetch } = useListDepartmentsQuery({ fetchPolicy: 'cache-and-network' });
  const [deleteDepartment] = useDeleteDepartmentMutation();
  const dialog = useCrudDialog<DepartmentRow>();
  const confirm = useConfirm();
  const notify = useNotify();

  const rows = data?.listDepartments ?? [];

  const columns: Column<DepartmentRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description', render: (r) => r.description ?? '—' },
  ];

  const handleDelete = async (row: DepartmentRow) => {
    const ok = await confirm({
      message: `Delete department "${row.name}"?`,
      confirmText: 'Delete',
    });
    if (!ok) return;
    await deleteDepartment({ variables: { id: row.id } });
    await refetch();
    notify('Department deleted');
  };

  return (
    <Box>
      <PageHeader
        title="Departments"
        subtitle="Used when assigning employees"
        actionLabel="New department"
        onAction={dialog.openCreate}
      />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          onEdit={dialog.openEdit}
          onDelete={handleDelete}
          emptyMessage={loading ? 'Loading…' : 'No departments yet.'}
        />
      </Box>
      <CrudDialog
        open={dialog.open}
        title={dialog.editing ? 'Edit department' : 'New department'}
        onClose={dialog.close}
      >
        <DepartmentForm
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
