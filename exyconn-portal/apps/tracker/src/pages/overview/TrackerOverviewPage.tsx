import { useState } from 'react';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import {
  ModuleOverview,
  type OverviewBreakdown,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import {
  useTrackerAccessListQuery,
  useTrackerBillingQuery,
  useTrackerDevicesQuery,
  useTrackerPendingManualEntriesQuery,
  type TrackerBillingQuery,
} from '@exyconn/shell/graphql/generated';
import { color } from '@exyconn/shell/components/ui';
import { moneyFormat, monthRange } from '../tracker/tracker.billing';
import { countBy } from './tracker-overview';

/** How many employees the overview lists before sending you to the billing report. */
const TOP_EMPLOYEES = 8;

type BillingRow = TrackerBillingQuery['trackerBilling']['rows'][number];

/** Time Tracker → Overview: who is tracking, on what, and what it is worth this month. */
export function TrackerOverviewPage() {
  // The month is fixed for the life of the page, exactly as the billing report opens it.
  const [range] = useState(monthRange);
  const { data: accessData } = useTrackerAccessListQuery();
  const { data: devicesData } = useTrackerDevicesQuery();
  const { data: pendingData } = useTrackerPendingManualEntriesQuery();
  const { data: billingData, loading, refetch } = useTrackerBillingQuery({ variables: range });

  const tracking = (accessData?.trackerAccessList ?? []).filter((row) => row.isActive);
  const devices = (devicesData?.trackerDevices ?? []).filter((row) => row.isActive);
  const pending = pendingData?.trackerPendingManualEntries ?? [];
  const billing = billingData?.trackerBilling;
  const money = moneyFormat(billing?.currency);
  // Busiest first, and only the top few: both the bars and the table read as a ranking.
  const rows = [...(billing?.rows ?? [])].sort((a, b) => b.hours - a.hours).slice(0, TOP_EMPLOYEES);

  const statItems: StatItem[] = [
    { label: 'Tracking', value: String(tracking.length), accent: color.blue[400] },
    { label: 'Devices', value: String(devices.length), accent: color.cyan[600] },
    {
      label: 'Hours this month',
      value: (billing?.totalHours ?? 0).toFixed(1),
      accent: color.green[500],
    },
    { label: 'Awaiting approval', value: String(pending.length), accent: color.amber[500] },
  ];

  const breakdowns: OverviewBreakdown[] = [
    {
      title: 'Hours this month, top employees',
      buckets: rows.map((row) => ({ value: row.name, count: Math.round(row.hours) })),
      accent: color.green[500],
    },
    {
      title: 'Devices by platform',
      buckets: countBy(devices, (device) => device.platform),
      accent: color.cyan[600],
    },
  ];

  const columns: Column<BillingRow>[] = [
    { key: 'name', label: 'Employee' },
    { key: 'email', label: 'Email' },
    { key: 'hours', label: 'Hours', render: (r) => r.hours.toFixed(1) },
    {
      key: 'billingRate',
      label: 'Rate / hour',
      render: (r) => (r.rated ? money.format(r.billingRate) : '—'),
    },
    { key: 'amount', label: 'Amount', render: (r) => (r.rated ? money.format(r.amount) : '—') },
  ];

  return (
    <ModuleOverview
      title="Time Tracker"
      subtitle="Who is tracking, and what this month is worth"
      stats={statItems}
      breakdowns={breakdowns}
      links={[
        { label: 'Open activity', to: '/tracker/activity' },
        { label: 'Off-computer time', to: '/tracker/approvals' },
        { label: 'Open billing', to: '/tracker/billing' },
        { label: 'Manage access', to: '/tracker/access' },
      ]}
      recentTitle="This month, busiest first"
    >
      <DataTable
        columns={columns}
        rows={rows}
        emptyMessage="No tracked time this month."
        loading={loading}
        onRefresh={refetch}
      />
    </ModuleOverview>
  );
}
