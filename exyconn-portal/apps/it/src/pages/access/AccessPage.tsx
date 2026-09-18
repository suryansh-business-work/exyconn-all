import { useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { color } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  FilterOp,
  ItAccessKind,
  ListItAccessRequestsPagedDocument,
  useCancelItAccessRequestMutation,
  useDecideItAccessRequestMutation,
  useDeleteItAccessRequestMutation,
  useFulfilItAccessRequestMutation,
  useListItAccessRequestsStatsQuery,
  type ListItAccessRequestsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { DecisionDialog, type DecisionValues } from '../../components/decision';
import { useRunAction } from '../../hooks/useRunAction';
import { AccessRequestForm, type AccessRequestRow } from './forms/access-request';
import { ACCESS_COLUMNS, type AccessGridContext, type PagedAccessRequestRow } from './access-grid';

interface AccessPageProps {
  /** Password Resets passes PASSWORD_RESET; Access Management shows every kind. */
  onlyKind?: ItAccessKind;
  title: string;
  subtitle: string;
  entityLabel: string;
}

/**
 * Access requests: grant, change, revoke or reset access to an application, each approved
 * and then carried out. Password Resets is the same register narrowed to one kind — the
 * password itself is never stored, only that the reset was asked for, approved and done.
 */
export function AccessPage({ onlyKind, title, subtitle, entityLabel }: Readonly<AccessPageProps>) {
  const { formatDate } = useSettings();
  const [deciding, setDeciding] = useState<PagedAccessRequestRow | null>(null);
  const { data: statsData, refetch: refetchStats } = useListItAccessRequestsStatsQuery();
  const [remove] = useDeleteItAccessRequestMutation();
  const [decide] = useDecideItAccessRequestMutation();
  const [fulfil] = useFulfilItAccessRequestMutation();
  const [cancel] = useCancelItAccessRequestMutation();
  const crud = useCrudResource<AccessRequestRow, PagedAccessRequestRow>({
    label: 'Request',
    onDelete: (row) => remove({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete the request for {app}?',
      values: { app: row.application },
    }),
    refetch: refetchStats,
  });
  const kindFilter = onlyKind ? [{ field: 'kind', op: FilterOp.Equals, value: onlyKind }] : [];
  const fetchRows = usePagedFetcher(
    ListItAccessRequestsPagedDocument,
    (data: ListItAccessRequestsPagedQuery) => data.listItAccessRequestsPaged,
    kindFilter,
  );

  const runAction = useRunAction(crud.reload);

  const stats = statsData?.listItAccessRequestsStats;
  const statItems: StatItem[] = [
    { label: 'Requests', value: String(statTotal(stats)), accent: color.cyan[600] },
    {
      label: 'Awaiting decision',
      value: String(statCount(stats, 'status', 'PENDING')),
      accent: color.amber[500],
    },
    {
      label: 'Approved, to do',
      value: String(statCount(stats, 'status', 'APPROVED')),
      accent: color.blue[400],
    },
    {
      label: 'Password resets',
      value: String(statCount(stats, 'kind', 'PASSWORD_RESET')),
      accent: color.violet[400],
    },
  ];

  const gridContext: AccessGridContext = {
    actions: {
      decide: setDeciding,
      fulfil: (row: PagedAccessRequestRow) =>
        runAction(() => fulfil({ variables: { id: row.id } }), 'Marked as done'),
      cancel: (row: PagedAccessRequestRow) =>
        runAction(() => cancel({ variables: { id: row.id } }), 'Request cancelled'),
      edit: crud.openEdit,
      delete: crud.remove,
    },
    formatDate,
  };

  const onDecide = ({ decision, note }: DecisionValues) =>
    decide({ variables: { id: deciding?.id ?? '', decision, note } });

  return (
    <CrudDashboard
      title={title}
      subtitle={subtitle}
      entityLabel={entityLabel}
      exportFileName={onlyKind ? 'password-resets' : 'access-requests'}
      permissionModule="ItAccessRequest"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <AccessRequestForm
          initial={initial}
          kind={onlyKind ?? ItAccessKind.Grant}
          lockKind={Boolean(onlyKind)}
          onCancel={crud.close}
          onDone={crud.onDone}
        />
      )}
      columnDefs={ACCESS_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by employee, application or reason…"
      extraDialogs={
        <DecisionDialog
          title={deciding ? `${deciding.employeeName} — ${deciding.application}` : null}
          onDecide={onDecide}
          onClose={() => setDeciding(null)}
          onDecided={crud.reload}
        />
      }
    />
  );
}
