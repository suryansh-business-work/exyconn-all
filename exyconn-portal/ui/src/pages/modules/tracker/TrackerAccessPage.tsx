import { Button, Chip } from '@/components/ui';
import { DataTable, type Column } from '@/components/data/DataTable';
import { ModuleDashboard } from '@/components/dashboard/ModuleDashboard';
import type { StatItem } from '@/components/dashboard/StatCard';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useSettings } from '@/hooks/useSettings';
import {
  useListUsersQuery,
  useTrackerAccessListQuery,
  useGrantTrackerAccessMutation,
  useRevokeTrackerAccessMutation,
} from '@/graphql/generated';
import { TrackerTimezoneCell } from './TrackerTimezoneCell';
import { useTrackerTimezones } from './useTrackerTimezones';
import type { TrackerAccessRow } from './tracker.types';

interface AccessUserRow {
  id: string;
  name: string;
  email: string;
  access: TrackerAccessRow | null;
}

/** Consent state chip for an employee's tracker access. */
function ConsentCell({ consentedAt }: Readonly<{ consentedAt: string | null }>) {
  if (consentedAt) return <Chip label="Consented" size="small" color="success" />;
  return <Chip label="Pending" size="small" color="warning" />;
}

interface AccessActionProps {
  active: boolean;
  onGrant: () => void;
  onRevoke: () => void;
}

/** Grant / Revoke toggle rendered per employee row. */
function AccessActionCell({ active, onGrant, onRevoke }: Readonly<AccessActionProps>) {
  if (active) {
    return (
      <Button size="small" color="error" variant="outlined" onClick={onRevoke}>
        Revoke
      </Button>
    );
  }
  return (
    <Button size="small" variant="contained" onClick={onGrant}>
      Grant
    </Button>
  );
}

/** Tracker access console — grant or revoke desktop tracking per employee. */
export function TrackerAccessPage() {
  const usersQuery = useListUsersQuery();
  const accessQuery = useTrackerAccessListQuery({ fetchPolicy: 'cache-and-network' });
  const [grantAccess] = useGrantTrackerAccessMutation();
  const [revokeAccess] = useRevokeTrackerAccessMutation();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();
  const { timezoneFor } = useTrackerTimezones();

  const accessByUser = new Map(
    (accessQuery.data?.trackerAccessList ?? []).map((entry) => [entry.userId, entry]),
  );
  const rows: AccessUserRow[] = (usersQuery.data?.listUsers ?? []).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    access: accessByUser.get(user.id) ?? null,
  }));

  const activeCount = rows.filter((row) => row.access?.isActive).length;
  const consentedCount = rows.filter((row) => row.access?.consentedAt).length;
  const stats: StatItem[] = [
    { label: 'Employees', value: String(rows.length), accent: '#4f8cff' },
    { label: 'With access', value: String(activeCount), accent: '#7be37b' },
    { label: 'Consented', value: String(consentedCount), accent: '#f9851f' },
    { label: 'No access', value: String(rows.length - activeCount), accent: '#ff6b6b' },
  ];

  const handleGrant = async (row: AccessUserRow) => {
    try {
      await grantAccess({ variables: { userId: row.id } });
      await accessQuery.refetch();
      notify(`Access granted — ${row.name} will receive an email`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Grant failed', 'error');
    }
  };

  const handleRevoke = async (row: AccessUserRow) => {
    const ok = await confirm({
      message: `Revoke tracker access for "${row.name}"?`,
      confirmText: 'Revoke',
    });
    if (!ok) return;
    try {
      await revokeAccess({ variables: { userId: row.id } });
      await accessQuery.refetch();
      notify('Access revoked');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Revoke failed', 'error');
    }
  };

  const columns: Column<AccessUserRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'consent',
      label: 'Consent',
      render: (row) => <ConsentCell consentedAt={row.access?.consentedAt ?? null} />,
    },
    {
      key: 'timezone',
      label: 'Timezone',
      render: (row) => <TrackerTimezoneCell resolution={timezoneFor(row.id)} />,
    },
    {
      key: 'grantedAt',
      label: 'Granted',
      render: (row) => (row.access?.isActive ? formatDate(row.access.grantedAt) : '—'),
    },
    {
      key: 'action',
      label: 'Access',
      render: (row) => (
        <AccessActionCell
          active={Boolean(row.access?.isActive)}
          onGrant={() => handleGrant(row)}
          onRevoke={() => handleRevoke(row)}
        />
      ),
    },
  ];

  return (
    <ModuleDashboard
      title="Tracker Access"
      subtitle="Grant or revoke desktop tracking"
      stats={stats}
    >
      <DataTable
        columns={columns}
        rows={rows}
        emptyMessage={usersQuery.loading ? 'Loading…' : 'No employees found.'}
      />
    </ModuleDashboard>
  );
}
