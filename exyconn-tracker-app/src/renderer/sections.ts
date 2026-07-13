import type { SvgIconComponent } from '@mui/icons-material';
import SpaceDashboardOutlined from '@mui/icons-material/SpaceDashboardOutlined';
import InsertChartOutlined from '@mui/icons-material/InsertChartOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';

/** The three panes behind the AppShell hamburger. */
export type Section = 'dashboard' | 'report' | 'settings';

export interface NavItem {
  id: Section;
  label: string;
  caption: string;
  icon: SvgIconComponent;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    caption: 'Tracking controls and live stats',
    icon: SpaceDashboardOutlined,
  },
  {
    id: 'report',
    label: 'My Report',
    caption: 'Your own tracked time, day by day',
    icon: InsertChartOutlined,
  },
  {
    id: 'settings',
    label: 'Settings & About',
    caption: 'What your workspace has configured',
    icon: TuneOutlined,
  },
];
