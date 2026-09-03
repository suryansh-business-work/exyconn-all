import { useState } from 'react';
import BlockIcon from '@mui/icons-material/Block';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { Text } from '@exyconn/shell/components/ui';
import {
  useTrackerDevicesQuery,
  useRevokeTrackerDeviceMutation,
} from '@exyconn/shell/graphql/generated';
import { TrackerDeviceDetails } from './TrackerDeviceDetails';
import { TrackerDeviceLastSeen } from './TrackerDeviceLastSeen';
import { useTrackerTimezones } from './useTrackerTimezones';
import { isDeviceOnline } from '@exyconn/shell/pages/tracker-view/tracker.format';
import type { TrackerDeviceRow } from '@exyconn/shell/pages/tracker-view/tracker.types';

/**
 * How often this console re-reads the device list. Matched to the desktop app's own
 * heartbeat, so "Online" stays true while an admin leaves the page open.
 */
const REFRESH_MS = 60_000;

/** Tracker devices console — the kill-switch for a lost or retired laptop. */
export function TrackerDevicesPage() {
  const { data, loading, refetch } = useTrackerDevicesQuery({
    fetchPolicy: 'cache-and-network',
    pollInterval: REFRESH_MS,
  });
  const [revokeDevice] = useRevokeTrackerDeviceMutation();
  const [selected, setSelected] = useState<TrackerDeviceRow | null>(null);
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDateTime } = useSettings();
  const { timezoneFor } = useTrackerTimezones();

  const rows = data?.trackerDevices ?? [];
  const activeCount = rows.filter((row) => row.isActive).length;
  // "Online" is what the desktop app's heartbeat buys us: not who was ever enrolled, but who
  // is running the tracker at this moment. Platform stays visible in the table's own column.
  const onlineCount = rows.filter((row) => row.isActive && isDeviceOnline(row.lastSeenAt)).length;
  const stats: StatItem[] = [
    { label: 'Devices', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Online now', value: String(onlineCount), accent: '#7be37b' },
    { label: 'Active', value: String(activeCount), accent: '#8b5cf6' },
    { label: 'Revoked', value: String(rows.length - activeCount), accent: '#ff6b6b' },
  ];

  const columns: Column<TrackerDeviceRow>[] = [
    {
      key: 'machine',
      label: 'Machine',
      render: (row) => (
        <>
          <Text size="sm" weight="medium" component="div">
            {row.hostname}
          </Text>
          <Text size="caption" color="text.secondary" component="div">
            {`${row.osName} ${row.osVersion}`}
          </Text>
        </>
      ),
    },
    { key: 'platform', label: 'Platform' },
    { key: 'appVersion', label: 'App version' },
    {
      key: 'lastSeenAt',
      label: 'Last seen',
      render: (row) => (
        <TrackerDeviceLastSeen
          lastSeenAt={row.lastSeenAt}
          isActive={row.isActive}
          formatDateTime={formatDateTime}
        />
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusChip value={row.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  const handleRevoke = async (row: TrackerDeviceRow) => {
    const ok = await confirm({
      message: `Revoke access for "${row.hostname}"? The device will be signed out.`,
      confirmText: 'Revoke',
    });
    if (!ok) return;
    try {
      await revokeDevice({ variables: { deviceId: row.deviceId } });
      await refetch();
      notify('Device revoked');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Revoke failed', 'error');
    }
  };

  return (
    <ModuleDashboard title="Tracker Devices" subtitle="Enrolled desktop agents" stats={stats}>
      <DataTable
        columns={columns}
        rows={rows}
        onRowClick={(row) => setSelected(row)}
        actions={[
          {
            icon: <BlockIcon fontSize="small" />,
            tooltip: 'Revoke device',
            ariaLabel: 'revoke device',
            color: 'error',
            onClick: handleRevoke,
          },
        ]}
        emptyMessage={loading ? 'Loading…' : 'No devices enrolled.'}
      />
      {selected && (
        <TrackerDeviceDetails
          device={selected}
          onClose={() => setSelected(null)}
          formatDateTime={formatDateTime}
          timezone={timezoneFor(selected.userId, selected.timezone)}
        />
      )}
    </ModuleDashboard>
  );
}
