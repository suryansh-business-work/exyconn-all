import { useState } from 'react';
import { useFormatters, useT } from '@exyconn/i18n';
import DeleteIcon from '@mui/icons-material/Delete';
import { Chip, Stack } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useBillingPlansQuery,
  useDeleteBillingPlanMutation,
} from '@exyconn/shell/graphql/generated';
import { PlanForm, type PlanRow } from './forms/plan';
import { modulesLabel, seatsLabel } from '../billing/plan.facts';

/** The plan's prices in every currency it is sold in, or "Free". */
function PlanPricesCell({ row }: Readonly<{ row: PlanRow }>) {
  const t = useT();
  const { formatCurrency } = useFormatters();
  if (row.prices.length === 0) return <>{t('Free')}</>;
  return (
    <>{row.prices.map((p) => formatCurrency(p.amount, { currency: p.currency })).join(' · ')}</>
  );
}

/** Offered, retired or the platform's own — a column cell, so it translates its own word. */
function PlanStateChip({ row }: Readonly<{ row: PlanRow }>) {
  const t = useT();
  if (row.isSystem) return <Chip size="small" variant="outlined" label={t('System')} />;
  if (!row.isActive)
    return <Chip size="small" variant="outlined" color="warning" label={t('Retired')} />;
  const label = row.isPublic ? t('Public') : t('Private');
  return <Chip size="small" variant="outlined" color="success" label={label} />;
}

function PlanSeatsCell({ row }: Readonly<{ row: PlanRow }>) {
  return <>{seatsLabel(row.seatLimit, useT())}</>;
}

function PlanModulesCell({ row }: Readonly<{ row: PlanRow }>) {
  return <>{modulesLabel(row, useT())}</>;
}

const COLUMNS: Column<PlanRow>[] = [
  { key: 'name', label: 'Plan' },
  { key: 'key', label: 'Key' },
  { key: 'prices', label: 'Price', render: (row) => <PlanPricesCell row={row} /> },
  { key: 'interval', label: 'Billed' },
  { key: 'trialDays', label: 'Trial days' },
  { key: 'seatLimit', label: 'Seats', render: (row) => <PlanSeatsCell row={row} /> },
  { key: 'modules', label: 'Modules', render: (row) => <PlanModulesCell row={row} /> },
  { key: 'isActive', label: 'State', render: (row) => <PlanStateChip row={row} /> },
];

/**
 * Admin › Plans (SUPER_ADMIN): the plans companies choose from. A plan's limits apply to every
 * company on it within a minute of an edit; one with subscribers is retired, not deleted.
 */
export function PlansPage() {
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const { data, loading, refetch } = useBillingPlansQuery();
  const [deletePlan] = useDeleteBillingPlanMutation();
  const [editing, setEditing] = useState<PlanRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const close = () => {
    setFormOpen(false);
    refetch().catch((error: unknown) => console.error('Could not reload plans', error));
  };

  const remove = async (row: PlanRow) => {
    const ok = await confirm({
      title: 'Delete plan',
      message: 'Delete {name}? Only a plan nobody is on can be deleted.',
      messageValues: { name: row.name },
      confirmText: 'Delete',
    });
    if (!ok) return;
    try {
      await deletePlan({ variables: { id: row.id } });
      notify('Plan deleted', 'success');
      await refetch();
    } catch (error) {
      notify(errorMessage(error, t('Could not delete the plan')), 'error');
    }
  };

  const actions: RowAction<PlanRow>[] = [
    {
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Delete',
      ariaLabel: 'Delete',
      color: 'error',
      hidden: (row) => row.isSystem,
      onClick: (row) => {
        remove(row).catch((error: unknown) => console.error('Could not delete the plan', error));
      },
    },
  ];

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Plans"
        subtitle="What companies can subscribe to: price, trial, seats, modules and AI"
        actionLabel="New plan"
        onAction={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      />
      <DataTable
        columns={COLUMNS}
        rows={data?.billingPlans ?? []}
        loading={loading}
        actions={actions}
        onEdit={(row) => {
          setEditing(row);
          setFormOpen(true);
        }}
        emptyMessage="No plans yet. Create one to open self sign-up."
        onRefresh={refetch}
      />
      <CrudDialog
        open={formOpen}
        title={editing ? t('Edit {name}', { name: editing.name }) : t('New plan')}
        onClose={close}
      >
        <PlanForm initial={editing} onDone={close} onCancel={close} />
      </CrudDialog>
    </Stack>
  );
}
