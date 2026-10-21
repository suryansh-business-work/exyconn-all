import { useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { useT } from '@exyconn/i18n';
import { Box, Button, Flex, Heading, Text } from '@/components/ui';
import { DataTable, type Column, type RowAction } from '@/components/data/DataTable';
import { StatusChip } from '@/components/data/StatusChip';
import { CrudDialog } from '@/components/data/CrudDialog';
import { panel } from '@/components/glass/glass';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { LEGAL_KIND_LABELS } from '@/components/legal';
import { useSettings } from '@/hooks/useSettings';
import { errorMessage } from '@/utils/errorMessage';
import {
  useEmployeeLegalAssignmentsQuery,
  useLegalAssignablesQuery,
  useUnassignLegalItemMutation,
  type LegalAssignmentFieldsFragment,
} from '@/graphql/generated';
import { AssignLegalForm, itemKey } from './forms/assign-legal';

type AssignmentRow = LegalAssignmentFieldsFragment;

/** Re-read after every change, so the list shows what the server now holds. */
const EMPLOYEE_LEGAL_QUERY = 'EmployeeLegalAssignments';

/**
 * HR/Legal panel: the contracts, policies and documents handed to one employee, with Assign
 * and Take back. The employee reads the same list on their own profile.
 */
export function EmployeeLegalPanel({ employeeId }: Readonly<{ employeeId: string }>) {
  const t = useT();
  const notify = useNotify();
  const confirm = useConfirm();
  const { formatDate } = useSettings();
  const [assigning, setAssigning] = useState(false);
  const held = useEmployeeLegalAssignmentsQuery({
    variables: { userId: employeeId },
    fetchPolicy: 'cache-and-network',
  });
  const assignables = useLegalAssignablesQuery({ skip: !assigning, fetchPolicy: 'network-only' });
  const [unassign] = useUnassignLegalItemMutation({ refetchQueries: [EMPLOYEE_LEGAL_QUERY] });

  const rows = useMemo(() => held.data?.employeeLegalAssignments ?? [], [held.data]);
  // Only what the employee does not already hold is offered.
  const options = useMemo(() => {
    const heldKeys = new Set(rows.map((row) => itemKey({ kind: row.kind, id: row.itemId })));
    return (assignables.data?.legalAssignables ?? []).filter((row) => !heldKeys.has(itemKey(row)));
  }, [rows, assignables.data]);

  const takeBack = async (row: AssignmentRow) => {
    const ok = await confirm({
      title: 'Take back',
      message: 'Take back "{title}"? It disappears from the employee’s profile.',
      messageValues: { title: row.title },
      confirmText: 'Take back',
      destructive: true,
    });
    if (!ok) {
      return;
    }
    try {
      await unassign({ variables: { id: row.id } });
      notify('Taken back');
    } catch (err) {
      notify(errorMessage(err, 'Could not take it back'), 'error');
    }
  };

  const actions: RowAction<AssignmentRow>[] = [
    {
      icon: <LinkOffIcon fontSize="small" />,
      tooltip: 'Take back',
      ariaLabel: 'take back',
      color: 'error',
      onClick: takeBack,
    },
  ];

  const columns: Column<AssignmentRow>[] = [
    { key: 'title', label: 'Title' },
    { key: 'kind', label: 'Type', render: (r) => t(LEGAL_KIND_LABELS[r.kind].one) },
    { key: 'groupName', label: 'Group', render: (r) => r.groupName ?? '—' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'assignedAt', label: 'Assigned', render: (r) => formatDate(r.assignedAt) },
    { key: 'assignedByName', label: 'By' },
  ];

  return (
    <Box sx={panel}>
      <Flex direction="row" justifyContent="space-between" alignItems="center" wrap spacing={1}>
        <Heading level={6}>{t('Contracts, policies & documents')}</Heading>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setAssigning(true)}>
          {t('Assign')}
        </Button>
      </Flex>
      <Text component="p" size="sm" color="text.secondary" sx={{ mt: 0.5, mb: 1 }}>
        {t('What this employee has been handed. They read these on their own profile.')}
      </Text>
      {held.error && <Text color="error">{held.error.message}</Text>}
      <DataTable
        columns={columns}
        rows={[...rows]}
        actions={actions}
        emptyMessage="Nothing assigned yet. Use Assign to hand over contracts, policies or documents."
        loading={held.loading}
        onRefresh={held.refetch}
      />
      <CrudDialog
        open={assigning}
        title={t('Assign contracts, policies & documents')}
        onClose={() => setAssigning(false)}
      >
        {assignables.error && <Text color="error">{assignables.error.message}</Text>}
        {assigning && assignables.data && (
          <AssignLegalForm
            employeeId={employeeId}
            options={options}
            onDone={() => setAssigning(false)}
            onCancel={() => setAssigning(false)}
          />
        )}
      </CrudDialog>
    </Box>
  );
}
