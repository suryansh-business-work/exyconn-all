import BlockIcon from '@mui/icons-material/Block';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import type { MaActionStatsQuery } from '@exyconn/shell/graphql/generated';
import { color } from '@exyconn/ui';

type Stats = MaActionStatsQuery['maActionStats'];

/** The two number formatters the tiles are written with, as `useFormatters` hands them over. */
interface Formatters {
  formatNumber: (value: number) => string;
  formatPercent: (value: number) => string;
}

/** How much of the checklist is done, as a whole percentage of the items that count. */
export function completionPercent(stats: Stats | undefined): number {
  const counted = stats ? stats.total - stats.cancelled : 0;
  if (!stats || counted <= 0) {
    return 0;
  }
  return Math.round((stats.completed / counted) * 100);
}

/** The checklist's completion tiles. */
export function actionStats(
  stats: Stats | undefined,
  { formatNumber, formatPercent }: Readonly<Formatters>,
): StatItem[] {
  const count = (value: number | undefined) => formatNumber(value ?? 0);
  return [
    {
      label: 'Completed',
      value: formatPercent(completionPercent(stats)),
      icon: TaskAltIcon,
      accent: color.green[500],
      info: 'Completed items as a share of every item except cancelled ones.',
    },
    {
      label: 'Open',
      value: count((stats?.pending ?? 0) + (stats?.inProgress ?? 0)),
      icon: PendingActionsIcon,
      accent: color.blue[400],
      info: 'Items that are pending or in progress.',
    },
    {
      label: 'Blocked',
      value: count(stats?.blocked),
      icon: BlockIcon,
      accent: color.amber[500],
      info: 'Items somebody marked as blocked.',
    },
    {
      label: 'Overdue',
      value: count(stats?.overdue),
      icon: EventBusyIcon,
      accent: color.red[200],
      info: 'Open items whose due date has passed.',
    },
    {
      label: 'Needs confirmation',
      value: count(stats?.needsConfirmation),
      icon: HelpOutlineIcon,
      accent: color.violet[400],
      info: 'Items whose owner or deadline the AI suggested and nobody has confirmed yet.',
    },
  ];
}
