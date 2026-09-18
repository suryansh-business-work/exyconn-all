import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, CircularProgress, Flex, Text } from '@exyconn/shell/components/ui';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { TableRefreshButton } from '@exyconn/shell/components/data/TableRefreshButton';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';

import { useCrudResource } from '@exyconn/crud';
import {
  useDeleteDepartmentMutation,
  useDeletePositionMutation,
  useListDepartmentsQuery,
} from '@exyconn/shell/graphql/generated';
import { DepartmentForm, type DepartmentRow } from './forms/department';
import { PositionForm, type PositionRow } from './forms/position';
import { DepartmentCard } from './departments/DepartmentCard';
import { densePanel } from '@exyconn/shell/components/glass/glass';

/**
 * HR Departments — each department with its positions nested inside. A position's name is
 * the designation offered on employee records of that department.
 */
export function DepartmentsPage() {
  const t = useT();
  const { data, loading, refetch } = useListDepartmentsQuery({ fetchPolicy: 'cache-and-network' });
  const [deleteDepartment] = useDeleteDepartmentMutation();
  const [deletePosition] = useDeletePositionMutation();
  // The department a new position is being added to; an edited one carries its own.
  const [positionDepartment, setPositionDepartment] = useState('');

  const departments = useCrudResource<DepartmentRow>({
    label: 'Department',
    onDelete: (row) => deleteDepartment({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete department "{name}"?',
      values: { name: row.name },
    }),
    refetch,
  });
  const positions = useCrudResource<PositionRow>({
    label: 'Position',
    onDelete: (row) => deletePosition({ variables: { id: row.id } }),
    confirmMessage: (row) => ({ message: 'Delete position "{name}"?', values: { name: row.name } }),
    refetch,
  });

  const addPosition = (department: string) => {
    setPositionDepartment(department);
    positions.openCreate();
  };

  if (departments.open) {
    return (
      <CrudFormPage
        title={departments.editing ? 'Edit department' : 'New department'}
        onBack={departments.close}
        backLabel="Back to Departments"
      >
        <DepartmentForm
          initial={departments.editing}
          onCancel={departments.close}
          onDone={departments.onDone}
        />
      </CrudFormPage>
    );
  }

  if (positions.open) {
    return (
      <CrudFormPage
        title={positions.editing ? 'Edit position' : 'New position'}
        onBack={positions.close}
        backLabel="Back to Departments"
      >
        <PositionForm
          initial={positions.editing}
          department={positionDepartment}
          onCancel={positions.close}
          onDone={positions.onDone}
        />
      </CrudFormPage>
    );
  }

  const rows = data?.listDepartments ?? [];

  return (
    <Box>
      <PageHeader
        title="Departments"
        subtitle="Departments and the positions inside them, with salary bands and headcount"
        actionLabel="New department"
        onAction={departments.openCreate}
      />
      <Box sx={densePanel}>
        <Flex direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
          <TableRefreshButton
            disabled={loading}
            onRefresh={() => {
              refetch().catch((error: unknown) =>
                console.error('Could not refresh departments', error),
              );
            }}
          />
        </Flex>
        {loading && rows.length === 0 && (
          <Flex direction="column" alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={24} aria-label={t('Loading departments')} />
          </Flex>
        )}
        {!loading && rows.length === 0 && (
          <Text color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
            {t('No departments yet.')}
          </Text>
        )}
        {rows.map((department) => (
          <DepartmentCard
            key={department.id}
            department={department}
            onEdit={departments.openEdit}
            onDelete={departments.remove}
            onAddPosition={addPosition}
            onEditPosition={positions.openEdit}
            onDeletePosition={positions.remove}
          />
        ))}
      </Box>
    </Box>
  );
}
