import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import type { AttendanceStatus } from './hrDashboard.selectors';

/** Loose shape of a `TableStats` payload as the generated hooks return it. */
type Stats = Parameters<typeof statTotal>[0];

export interface HrTileInputs {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  newJoiners: number;
  today: Record<AttendanceStatus, number>;
  pendingLeave: number;
  requestStats: Stats;
  goalStats: Stats;
  reviewStats: Stats;
  exitStats: Stats;
}

/** The tile row: every number an HR lead checks first thing in the morning. */
export function buildHrTiles(i: HrTileInputs): StatItem[] {
  const exitsInProgress =
    statTotal(i.exitStats) -
    statCount(i.exitStats, 'stage', 'EXITED') -
    statCount(i.exitStats, 'stage', 'WITHDRAWN');
  const appraisalsOpen =
    statCount(i.reviewStats, 'status', 'OPEN') +
    statCount(i.reviewStats, 'status', 'SELF_SUBMITTED') +
    statCount(i.reviewStats, 'status', 'MANAGER_SUBMITTED');

  return [
    { label: 'Employees', value: String(i.totalEmployees), accent: '#155dfc' },
    {
      label: 'Active / inactive',
      value: `${i.activeEmployees} / ${Math.max(i.totalEmployees - i.activeEmployees, 0)}`,
      accent: '#16a34a',
    },
    { label: 'New this month', value: String(i.newJoiners), accent: '#0ea5e9' },
    { label: 'On leave', value: String(i.onLeave), accent: '#f59e0b' },
    {
      label: 'Present today',
      value: String(i.today.PRESENT + i.today.HALF_DAY),
      accent: '#22c55e',
    },
    { label: 'WFH today', value: String(i.today.WFH), accent: '#06b6d4' },
    { label: 'Leave to approve', value: String(i.pendingLeave), accent: '#f97316' },
    {
      label: 'Requests pending',
      value: String(statCount(i.requestStats, 'status', 'PENDING')),
      accent: '#ef4444',
    },
    {
      label: 'Active goals',
      value: String(statCount(i.goalStats, 'status', 'ACTIVE')),
      accent: '#a855f7',
    },
    { label: 'Appraisals open', value: String(appraisalsOpen), accent: '#d946ef' },
    { label: 'Exits in progress', value: String(Math.max(exitsInProgress, 0)), accent: '#64748b' },
  ];
}
