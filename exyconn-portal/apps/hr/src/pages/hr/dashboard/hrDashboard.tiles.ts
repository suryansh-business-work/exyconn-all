import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import type { AttendanceStatus } from './hrDashboard.selectors';
import { color } from '@exyconn/shell/components/ui';

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
    { label: 'Employees', value: String(i.totalEmployees), accent: color.blue[600] },
    {
      label: 'Active / inactive',
      value: `${i.activeEmployees} / ${Math.max(i.totalEmployees - i.activeEmployees, 0)}`,
      accent: color.green[600],
    },
    { label: 'New this month', value: String(i.newJoiners), accent: color.sky[500] },
    { label: 'On leave', value: String(i.onLeave), accent: color.amber[500] },
    {
      label: 'Present today',
      value: String(i.today.PRESENT + i.today.HALF_DAY),
      accent: color.green[500],
    },
    { label: 'WFH today', value: String(i.today.WFH), accent: color.cyan[500] },
    { label: 'Leave to approve', value: String(i.pendingLeave), accent: color.orange[600] },
    {
      label: 'Requests pending',
      value: String(statCount(i.requestStats, 'status', 'PENDING')),
      accent: color.red[500],
    },
    {
      label: 'Active goals',
      value: String(statCount(i.goalStats, 'status', 'ACTIVE')),
      accent: color.purple[400],
    },
    { label: 'Appraisals open', value: String(appraisalsOpen), accent: color.fuchsia[500] },
    {
      label: 'Exits in progress',
      value: String(Math.max(exitsInProgress, 0)),
      accent: color.slate[500],
    },
  ];
}
