import { Box } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useCrudResource } from '@exyconn/crud';
import { useListPositionsQuery, useDeletePositionMutation } from '@exyconn/shell/graphql/generated';
import { PositionForm, type PositionRow } from './forms/position';

/** HR Positions — manage the designations reused on employee records. */
export function PositionsPage() {
  const { data, loading, refetch } = useListPositionsQuery({ fetchPolicy: 'cache-and-network' });
  const [deletePosition] = useDeletePositionMutation();
  const crud = useCrudResource<PositionRow>({
    label: 'Position',
    onDelete: (row) => deletePosition({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete position "${row.name}"?`,
    refetch,
  });

  const rows = data?.listPositions ?? [];

  const columns: Column<PositionRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'department', label: 'Department' },
    { key: 'description', label: 'Description', render: (r) => r.description ?? '—' },
  ];

  return (
    <Box>
      <PageHeader
        title="Positions"
        subtitle="Job titles used when assigning employees"
        actionLabel="New position"
        onAction={crud.openCreate}
      />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          onEdit={crud.openEdit}
          onDelete={crud.remove}
          emptyMessage={loading ? 'Loading…' : 'No positions yet.'}
        />
      </Box>
      <CrudDialog
        open={crud.open}
        title={crud.editing ? 'Edit position' : 'New position'}
        onClose={crud.close}
      >
        <PositionForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudDialog>
    </Box>
  );
}
