import type { IconName } from '../components/ui/Icon';

/** The panes behind the drawer — the desktop tracker's sections, one route each. */
export type Section = 'dashboard' | 'report' | 'messages' | 'off-computer' | 'settings';

export interface NavItem {
  id: Section;
  label: string;
  caption: string;
  icon: IconName;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    caption: 'Tracking controls and live stats',
    icon: 'view-dashboard-outline',
  },
  {
    id: 'report',
    label: 'My Report',
    caption: 'Your own tracked time, day by day',
    icon: 'chart-box-outline',
  },
  {
    id: 'messages',
    label: 'Messages',
    caption: 'Your line to whoever administers tracking',
    icon: 'forum-outline',
  },
  {
    id: 'off-computer',
    label: 'Off-computer time',
    caption: 'Claim hours the tracker could not measure',
    icon: 'calendar-clock-outline',
  },
  {
    id: 'settings',
    label: 'Settings & About',
    caption: 'What your workspace has configured',
    icon: 'tune-variant',
  },
];

export function titleOf(section: Section): string {
  return NAV_ITEMS.find((item) => item.id === section)?.label ?? '';
}
