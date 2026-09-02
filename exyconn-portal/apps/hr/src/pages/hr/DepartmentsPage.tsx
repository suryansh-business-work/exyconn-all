import { Box } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useCrudResource } from '@exyconn/crud';
import {
  useListDepartmentsQuery,
  useDeleteDepartmentMutation,
} from '@exyconn/shell/graphql/generated';
import { DepartmentForm, type DepartmentRow } from './forms/department';

/** HR Departments — manage the departments reused on employee records. */
export function DepartmentsPage() {
  const { data, loading, refetch } = useListDepartmentsQuery({ fetchPolicy: 'cache-and-network' });
  const [deleteDepartment] = useDeleteDepartmentMutation();
  const crud = useCrudResource<DepartmentRow>({
    label: 'Department',
    onDelete: (row) => deleteDepartment({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete department "${row.name}"?`,
    refetch,
  });

  const rows = data?.listDepartments ?? [];

  const columns: Column<DepartmentRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description', render: (r) => r.description ?? '—' },
  ];

  return (
    <Box>
      <PageHeader
        title="Departments"
        subtitle="Used when assigning employees"
        actionLabel="New department"
        onAction={crud.openCreate}
      />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          onEdit={crud.openEdit}
          onDelete={crud.remove}
          emptyMessage={loading ? 'Loading…' : 'No departments yet.'}
        />
      </Box>
      <CrudDialog
        open={crud.open}
        title={crud.editing ? 'Edit department' : 'New department'}
        onClose={crud.close}
      >
        <DepartmentForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudDialog>
    </Box>
  );
}
