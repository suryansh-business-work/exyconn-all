import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import type { MaDashboardQuery } from '@exyconn/shell/graphql/generated';
import { color } from '@exyconn/ui';
import { formatSeconds } from '../lib/format';

type Dashboard = MaDashboardQuery['maDashboard'];

/**
 * The eight dashboard tiles. Every figure is counted by the server over the filtered meetings;
 * `info` says how, so nobody has to guess what "pending" or "failure" means.
 */
export function dashboardStats(
  dashboard: Dashboard | undefined,
  formatNumber: (value: number) => string,
): StatItem[] {
  const count = (value: number | undefined) => formatNumber(value ?? 0);
  return [
    {
      label: 'Total Meetings',
      value: count(dashboard?.totalMeetings),
      icon: VideoCallIcon,
      accent: color.blue[400],
      info: 'Every recorded Google Meet call that matches the filters.',
    },
    {
      label: 'Meetings This Month',
      value: count(dashboard?.meetingsThisMonth),
      icon: CalendarMonthIcon,
      accent: color.violet[400],
      info: 'Matching calls that started in the current calendar month.',
    },
    {
      label: 'Total Meeting Duration',
      value: formatSeconds(dashboard?.totalDurationSeconds ?? 0),
      icon: AccessTimeIcon,
      accent: color.sky[500],
      info: 'The time from start to end of every matching call, added up.',
    },
    {
      label: 'AI Notes Generated',
      value: count(dashboard?.notesGenerated),
      icon: AutoAwesomeIcon,
      accent: color.indigo[400],
      info: 'Matching calls whose AI summary finished successfully.',
    },
    {
      label: 'Pending Actions',
      value: count(dashboard?.pendingActions),
      icon: PendingActionsIcon,
      accent: color.amber[500],
      info: 'Action items from matching calls that are not completed or cancelled yet.',
    },
    {
      label: 'Completed Actions',
      value: count(dashboard?.completedActions),
      icon: TaskAltIcon,
      accent: color.green[500],
      info: 'Action items from matching calls that were marked completed.',
    },
    {
      label: 'Overdue Actions',
      value: count(dashboard?.overdueActions),
      icon: EventBusyIcon,
      accent: color.red[200],
      info: 'Open action items whose due date has passed.',
    },
    {
      label: 'Transcription Failures',
      value: count(dashboard?.transcriptionFailures),
      icon: ErrorOutlineIcon,
      accent: color.orange[500],
      info: 'Audio chunks from matching calls that could not be transcribed, added up.',
    },
  ];
}
