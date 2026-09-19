import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Flex, Heading, Text } from '@/components/ui';
import { DataTable, type Column, type RowAction } from '@/components/data/DataTable';
import { CrudDialog } from '@/components/data/CrudDialog';
import { panel } from '@/components/glass/glass';
import { portalLogger } from '@/logging/portalLogger';
import { LeaveBalanceForm, type LeaveBalanceRow } from './forms/leave-balance';
import { useEmployeeLeaveBalances } from './useEmployeeLeaveBalances';

/** A signed number of days, so an adjustment reads as what it does: +2 or -1. */
const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

/** The open form: adding a new leave type, adjusting a held one, or none. */
type Editing = { row: LeaveBalanceRow | null } | null;

/**
 * HR's view of one employee's leave for the current year: every type they hold, how the
 * available days are made up, and where days are added, taken away or a type removed.
 */
export function EmployeeLeaveBalancePanel({ employeeId }: Readonly<{ employeeId: string }>) {
  const t = useT();
  const year = new Date().getFullYear();
  const balances = useEmployeeLeaveBalances(employeeId, year);
  const [editing, setEditing] = useState<Editing>(null);

  const close = () => setEditing(null);
  const saved = () => {
    close();
    balances
      .refetch()
      .catch((error: unknown) => portalLogger.warn('Could not reload leave balances', error));
  };

  const columns: Column<LeaveBalanceRow>[] = [
    {
      key: 'leaveTypeCode',
      label: 'Leave type',
      render: (row) => balances.nameOf(row.leaveTypeCode),
    },
    { key: 'allocated', label: 'Allocated' },
    { key: 'carriedForward', label: 'Carried forward' },
    { key: 'adjustment', label: 'Adjustment', render: (row) => signed(row.adjustment) },
    { key: 'used', label: 'Used' },
    {
      key: 'available',
      label: 'Available',
      render: (row) => <Text weight="bold">{row.available}</Text>,
    },
  ];
  const actions: RowAction<LeaveBalanceRow>[] = [
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Add or take away days',
      ariaLabel: 'adjust leave balance',
      onClick: (row) => setEditing({ row }),
    },
    {
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Remove this leave type',
      ariaLabel: 'remove leave balance',
      color: 'error',
      onClick: (row) => {
        balances
          .remove(row)
          .catch((error: unknown) => portalLogger.error('Removing a leave balance failed', error));
      },
    },
  ];

  return (
    <Box sx={panel}>
      <Flex direction="row" justifyContent="space-between" alignItems="center" wrap spacing={1}>
        <Heading level={6}>{t('Leave balance {year}', { year })}</Heading>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setEditing({ row: null })}
          disabled={balances.loading}
        >
          {t('Add leave type')}
        </Button>
      </Flex>
      <Text component="p" size="sm" color="text.secondary" sx={{ mt: 0.5, mb: 1 }}>
        {t('Available = allocated + carried forward + adjustment − used.')}
      </Text>
      {balances.error && <Text color="error">{balances.error.message}</Text>}
      <DataTable
        columns={columns}
        rows={[...balances.rows]}
        actions={actions}
        emptyMessage="No leave types yet. Set them up under HR › Leave Settings, or add one here."
        loading={balances.loading}
        onRefresh={balances.refetch}
      />
      <CrudDialog
        open={editing !== null}
        title={editing?.row ? t('Adjust leave balance') : t('Add leave type')}
        onClose={close}
      >
        {editing && (
          <LeaveBalanceForm
            employeeId={employeeId}
            year={year}
            initial={editing.row}
            typeOptions={balances.addable}
            onDone={saved}
            onCancel={close}
          />
        )}
      </CrudDialog>
    </Box>
  );
}
