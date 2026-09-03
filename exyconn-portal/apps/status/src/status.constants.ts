import type { SvgIconComponent } from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { StatusCategory, StatusState } from '@exyconn/shell/graphql/generated';

/** Theme palette key a state paints itself with, so both colour modes stay legible. */
export type StateTone = 'success' | 'warning' | 'error' | 'info';

interface StateMeta {
  /** Wording next to a single service. */
  label: string;
  /** Wording in the page-wide banner. */
  headline: string;
  tone: StateTone;
  icon: SvgIconComponent;
}

/** How every state is presented. One map so the banner, chips and bars never disagree. */
export const STATE_META: Record<StatusState, StateMeta> = {
  [StatusState.Operational]: {
    label: 'Operational',
    headline: 'All systems operational',
    tone: 'success',
    icon: CheckCircleIcon,
  },
  [StatusState.Degraded]: {
    label: 'Degraded',
    headline: 'Degraded performance',
    tone: 'warning',
    icon: WarningAmberIcon,
  },
  [StatusState.Down]: {
    label: 'Down',
    headline: 'Service disruption',
    tone: 'error',
    icon: ErrorOutlineIcon,
  },
  [StatusState.Unknown]: {
    label: 'Not checked yet',
    headline: 'Waiting for the first check',
    tone: 'info',
    icon: HelpOutlineIcon,
  },
};

/** Section headings on the status page, in the order the groups are rendered. */
export const CATEGORY_LABELS: Record<StatusCategory, string> = {
  [StatusCategory.Website]: 'Website',
  [StatusCategory.Portal]: 'Portals',
  [StatusCategory.Api]: 'APIs',
  [StatusCategory.Tool]: 'Tools',
  [StatusCategory.DesktopApp]: 'Desktop apps',
};

export const CATEGORY_ORDER: StatusCategory[] = [
  StatusCategory.Website,
  StatusCategory.Portal,
  StatusCategory.Api,
  StatusCategory.Tool,
  StatusCategory.DesktopApp,
];

/** Days of history the page asks for; also the number of uptime bars per service. */
export const HISTORY_DAYS = 90;

/** How often the page re-reads the API, in milliseconds. */
export const REFRESH_MS = 60_000;

export const DATE_FORMAT = 'd MMM yyyy';
export const TIME_FORMAT = 'd MMM yyyy, HH:mm';
