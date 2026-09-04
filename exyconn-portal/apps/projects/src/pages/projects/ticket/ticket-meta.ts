import BugReportIcon from '@mui/icons-material/BugReport';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import BoltIcon from '@mui/icons-material/Bolt';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import type { SvgIconComponent } from '@mui/icons-material';
import { TaskPriority, TaskType } from '@exyconn/shell/graphql/generated';

/** How one enum value is drawn: its wording, its icon and the colour that carries it. */
export interface TicketFacet {
  label: string;
  icon: SvgIconComponent;
  color: string;
}

/**
 * Presentation for the two enums a ticket is read by at a glance. The values themselves come
 * from the schema (the generated `TaskType` / `TaskPriority`); only how they LOOK lives here,
 * so a new value in the schema is a compile error in this table rather than a silent blank.
 */
export const TICKET_TYPES: Readonly<Record<TaskType, TicketFacet>> = {
  [TaskType.Story]: { label: 'Story', icon: BookmarkIcon, color: '#22c55e' },
  [TaskType.Task]: { label: 'Task', icon: TaskAltIcon, color: '#3b82f6' },
  [TaskType.Bug]: { label: 'Bug', icon: BugReportIcon, color: '#ef4444' },
  [TaskType.Epic]: { label: 'Epic', icon: BoltIcon, color: '#8b5cf6' },
};

export const TICKET_PRIORITIES: Readonly<Record<TaskPriority, TicketFacet>> = {
  [TaskPriority.Highest]: {
    label: 'Highest',
    icon: KeyboardDoubleArrowUpIcon,
    color: '#dc2626',
  },
  [TaskPriority.High]: { label: 'High', icon: KeyboardArrowUpIcon, color: '#f97316' },
  [TaskPriority.Medium]: { label: 'Medium', icon: DragHandleIcon, color: '#f59e0b' },
  [TaskPriority.Low]: { label: 'Low', icon: KeyboardArrowDownIcon, color: '#22c55e' },
  [TaskPriority.Lowest]: {
    label: 'Lowest',
    icon: KeyboardDoubleArrowDownIcon,
    color: '#16a34a',
  },
};

/** The options a picker offers, in the order they should be offered. */
export const TICKET_TYPE_OPTIONS = Object.entries(TICKET_TYPES).map(([value, facet]) => ({
  value,
  label: facet.label,
}));

export const TICKET_PRIORITY_OPTIONS = Object.entries(TICKET_PRIORITIES).map(([value, facet]) => ({
  value,
  label: facet.label,
}));

/** Initials for an avatar — "Asha Rao" becomes "AR". Empty for nobody. */
export function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter((part) => part !== '')
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
