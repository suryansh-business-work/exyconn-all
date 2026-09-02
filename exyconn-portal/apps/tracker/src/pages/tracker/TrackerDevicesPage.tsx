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
import { useTrackerTimezones } from './useTrackerTimezones';
import type { TrackerDeviceRow } from '@exyconn/shell/pages/tracker-view/tracker.types';

/** Tracker devices console — the kill-switch for a lost or retired laptop. */
export function TrackerDevicesPage() {
  const { data, loading, refetch } = useTrackerDevicesQuery({ fetchPolicy: 'cache-and-network' });
  const [revokeDevice] = useRevokeTrackerDeviceMutation();
  const [selected, setSelected] = useState<TrackerDeviceRow | null>(null);
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDateTime } = useSettings();
  const { timezoneFor } = useTrackerTimezones();

  const rows = data?.trackerDevices ?? [];
  const activeCount = rows.filter((row) => row.isActive).length;
  const platforms = new Set(rows.map((row) => row.platform)).size;
  const stats: StatItem[] = [
    { label: 'Devices', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Active', value: String(activeCount), accent: '#7be37b' },
    { label: 'Revoked', value: String(rows.length - activeCount), accent: '#ff6b6b' },
    { label: 'Platforms', value: String(platforms), accent: '#8b5cf6' },
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
    { key: 'lastSeenAt', label: 'Last seen', render: (row) => formatDateTime(row.lastSeenAt) },
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
