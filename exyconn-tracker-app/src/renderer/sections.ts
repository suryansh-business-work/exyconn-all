import type { SvgIconComponent } from '@mui/icons-material';
import SpaceDashboardOutlined from '@mui/icons-material/SpaceDashboardOutlined';
import InsertChartOutlined from '@mui/icons-material/InsertChartOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined';
import ForumOutlined from '@mui/icons-material/ForumOutlined';

/** The panes behind the AppShell's tab bar. */
export type Section = 'dashboard' | 'report' | 'messages' | 'off-computer' | 'settings';

export interface NavItem {
  id: Section;
  /** The page's big title. */
  label: string;
  /** What the tab bar's selected pill says — short enough to sit beside four icons. */
  short: string;
  caption: string;
  icon: SvgIconComponent;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: 'dashboard',
    short: 'Home',
    label: 'Dashboard',
    caption: 'Tracking controls and live stats',
    icon: SpaceDashboardOutlined,
  },
  {
    id: 'report',
    short: 'Report',
    label: 'My Report',
    caption: 'Your own tracked time, day by day',
    icon: InsertChartOutlined,
  },
  {
    id: 'messages',
    short: 'Messages',
    label: 'Messages',
    caption: 'Your line to whoever administers tracking',
    icon: ForumOutlined,
  },
  {
    id: 'off-computer',
    short: 'Off-computer',
    label: 'Off-computer time',
    caption: 'Claim hours the tracker could not measure',
    icon: EventNoteOutlined,
  },
  {
    id: 'settings',
    short: 'Settings',
    label: 'Settings',
    caption: 'What your workspace has configured',
    icon: TuneOutlined,
  },
];
