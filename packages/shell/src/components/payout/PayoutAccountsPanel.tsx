import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useT } from '@exyconn/i18n';
import { PAYOUT_METHOD_LABELS, type PayoutMethod } from '@exyconn/payout';
import { Box, Button, Chip, Flex, Heading, Text } from '@/components/ui';
import { DataTable, type Column, type RowAction } from '@/components/data/DataTable';
import { CrudDialog } from '@/components/data/CrudDialog';
import { panel } from '@/components/glass/glass';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { errorMessage } from '@/utils/errorMessage';
import {
  PayoutAccountForm,
  type PayoutAccountApi,
  type PayoutAccountRow,
} from './forms/payout-account';
import { PayoutAccountDetails } from './PayoutAccountDetails';

interface PayoutAccountsPanelProps {
  title: string;
  description: string;
  rows: readonly PayoutAccountRow[];
  loading: boolean;
  error?: string;
  onRefresh: () => Promise<unknown>;
  /** Salary or refund methods. */
  methods: readonly PayoutMethod[];
  defaultCountry: string;
  defaultCurrency: string;
  api: PayoutAccountApi;
  /** Called by Remove on an editable panel. */
  onDelete?: (row: PayoutAccountRow) => Promise<unknown>;
  editable: boolean;
}

/** Which drawer is open: a form (row or new) or one account's details. */
type Open =
  { kind: 'form'; row: PayoutAccountRow | null } | { kind: 'details'; row: PayoutAccountRow };

/**
 * A payee's payout accounts — an employee's salary accounts in HR, a client's refund accounts
 * in the client hub and in Admin › Clients. One screen for all three; each hands it its own API.
 */
export function PayoutAccountsPanel(props: Readonly<PayoutAccountsPanelProps>) {
  const { title, description, rows, loading, error, onRefresh, api, onDelete, editable } = props;
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const [open, setOpen] = useState<Open | null>(null);
  const close = () => setOpen(null);

  const remove = async (row: PayoutAccountRow) => {
    const ok = await confirm({
      title: 'Remove account',
      message: 'Remove the account {summary}? Payments stop going to it.',
      messageValues: { summary: row.summary },
      confirmText: 'Remove',
      destructive: true,
    });
    if (!ok || !onDelete) {
      return;
    }
    try {
      await onDelete(row);
      notify('Account removed');
    } catch (err) {
      notify(errorMessage(err, 'Could not remove the account'), 'error');
    }
  };

  const columns: Column<PayoutAccountRow>[] = [
    {
      key: 'method',
      label: 'Method',
      render: (r) => (
        <Flex direction="row" spacing={1} alignItems="center">
          <span>{t(PAYOUT_METHOD_LABELS[r.method].label)}</span>
          {r.isPrimary && <Chip size="small" color="primary" label={t('Default')} />}
        </Flex>
      ),
    },
    { key: 'holderName', label: 'Name' },
    { key: 'summary', label: 'Account' },
    { key: 'country', label: 'Country' },
    { key: 'currency', label: 'Currency' },
  ];

  const viewAction: RowAction<PayoutAccountRow> = {
    icon: <VisibilityIcon fontSize="small" />,
    tooltip: 'View details',
    ariaLabel: 'view details',
    onClick: (row) => setOpen({ kind: 'details', row }),
  };
  const editActions: RowAction<PayoutAccountRow>[] = [
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit',
      ariaLabel: 'edit',
      onClick: (row) => setOpen({ kind: 'form', row }),
    },
    {
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Remove',
      ariaLabel: 'remove',
      color: 'error',
      onClick: (row) => {
        remove(row).catch((err: unknown) => notify(errorMessage(err, 'Could not remove'), 'error'));
      },
    },
  ];
  const actions = editable ? [viewAction, ...editActions] : [viewAction];
  const drawerTitle = open?.kind === 'details' ? t('Account details') : t(title);

  return (
    <Box sx={panel}>
      <Flex direction="row" justifyContent="space-between" alignItems="center" wrap spacing={1}>
        <Heading level={6}>{t(title)}</Heading>
        {editable && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOpen({ kind: 'form', row: null })}
          >
            {t('Add account')}
          </Button>
        )}
      </Flex>
      <Text component="p" size="sm" color="text.secondary" sx={{ mt: 0.5, mb: 1 }}>
        {t(description)}
      </Text>
      {error && <Text color="error">{error}</Text>}
      <DataTable
        columns={columns}
        rows={[...rows]}
        actions={actions}
        emptyMessage="No account on file yet."
        loading={loading}
        onRefresh={onRefresh}
      />
      <CrudDialog open={open !== null} title={drawerTitle} onClose={close}>
        {open?.kind === 'details' && <PayoutAccountDetails row={open.row} reveal={api.reveal} />}
        {open?.kind === 'form' && (
          <PayoutAccountForm
            initial={open.row}
            methods={props.methods}
            defaultCountry={props.defaultCountry}
            defaultCurrency={props.defaultCurrency}
            api={api}
            onDone={close}
            onCancel={close}
          />
        )}
      </CrudDialog>
    </Box>
  );
}
