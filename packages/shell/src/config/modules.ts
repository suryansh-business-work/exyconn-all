import type { SvgIconComponent } from '@mui/icons-material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BugReportIcon from '@mui/icons-material/BugReport';
import GroupsIcon from '@mui/icons-material/Groups';
import BadgeIcon from '@mui/icons-material/Badge';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CampaignIcon from '@mui/icons-material/Campaign';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import StarIcon from '@mui/icons-material/Star';
import ReceiptIcon from '@mui/icons-material/Receipt';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import SchoolIcon from '@mui/icons-material/School';
import FolderIcon from '@mui/icons-material/Folder';
import GavelIcon from '@mui/icons-material/Gavel';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import HubIcon from '@mui/icons-material/Hub';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TerminalIcon from '@mui/icons-material/Terminal';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PersonIcon from '@mui/icons-material/Person';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PlaceIcon from '@mui/icons-material/Place';
import GroupsIcon2 from '@mui/icons-material/Diversity3';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LogoutIcon from '@mui/icons-material/Logout';
import WorkIcon from '@mui/icons-material/Work';
import DescriptionIcon from '@mui/icons-material/Description';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PolicyIcon from '@mui/icons-material/Policy';
import CelebrationIcon from '@mui/icons-material/Celebration';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import LanguageIcon from '@mui/icons-material/Language';
import ArticleIcon from '@mui/icons-material/Article';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HandymanIcon from '@mui/icons-material/Handyman';
import CategoryIcon from '@mui/icons-material/Category';
import BuildIcon from '@mui/icons-material/Build';
import LinkIcon from '@mui/icons-material/Link';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import DevicesIcon from '@mui/icons-material/Devices';
import TuneIcon from '@mui/icons-material/Tune';
import PaletteIcon from '@mui/icons-material/Palette';
import { ROLES, type Role } from '@/auth/roles';
import { appUrl, type PortalAppKey } from './apps';

/** A nested navigation entry shown under a parent module in the sidebar. */
export interface ModuleChild {
  key: string;
  label: string;
  path: string;
  icon: SvgIconComponent;
}

export interface ModuleDefinition {
  /** Doubles as the key of the micro-frontend that serves this module. */
  key: PortalAppKey;
  label: string;
  path: string;
  role: Role;
  icon: SvgIconComponent;
  description: string;
  accent: string;
  children?: ModuleChild[];
}

/**
 * Single source of truth for the portal's modules, ordered to the role model.
 * Each top-level entry maps to exactly one role and to exactly one micro-frontend
 * (`key` is also its app key); `accessibleModules` filters by the signed-in
 * user's roles, so navigation is fully role-driven (dynamic).
 * Bugs is nested under Projects and Clients + Tech under Admin (consolidated).
 */
export const MODULES: ModuleDefinition[] = [
  {
    key: 'employee',
    label: 'My Workspace',
    path: '/me',
    role: ROLES.EMPLOYEE,
    icon: BadgeIcon,
    description: 'Everything you need day to day',
    accent: '#14b8a6',
    children: [
      { key: 'me-dashboard', label: 'Dashboard', path: '/me', icon: DashboardIcon },
      {
        key: 'me-announcements',
        label: 'Announcements',
        path: '/me/announcements',
        icon: CampaignIcon,
      },
      { key: 'me-profile', label: 'My Profile', path: '/profile', icon: PersonIcon },
      { key: 'me-payroll', label: 'Payroll', path: '/me/payroll', icon: PaymentsIcon },
      {
        key: 'me-salary-slips',
        label: 'Salary Slips',
        path: '/me/salary-slips',
        icon: ReceiptLongIcon,
      },
      {
        key: 'me-leave',
        label: 'Leave Management',
        path: '/me/leave',
        icon: EventAvailableIcon,
      },
      {
        key: 'me-attendance',
        label: 'My Attendance',
        path: '/me/attendance',
        icon: HowToRegIcon,
      },
      { key: 'me-holidays', label: 'Holidays', path: '/me/holidays', icon: CelebrationIcon },
      {
        key: 'me-calendar',
        label: 'Calendar',
        path: '/me/calendar',
        icon: CalendarMonthIcon,
      },
      {
        key: 'me-notifications',
        label: 'Notifications',
        path: '/me/notifications',
        icon: NotificationsIcon,
      },
      { key: 'me-requests', label: 'My Requests', path: '/me/requests', icon: AssignmentIcon },
      { key: 'me-goals', label: 'Goals', path: '/me/goals', icon: TrackChangesIcon },
      { key: 'me-performance', label: 'Performance', path: '/me/performance', icon: StarIcon },
      { key: 'me-expenses', label: 'Expenses', path: '/me/expenses', icon: ReceiptIcon },
      { key: 'me-benefits', label: 'Benefits', path: '/me/benefits', icon: HealthAndSafetyIcon },
      { key: 'me-training', label: 'Learning', path: '/me/training', icon: SchoolIcon },
      { key: 'me-documents', label: 'My Documents', path: '/me/documents', icon: FolderIcon },
      { key: 'me-policies', label: 'Policies', path: '/me/policies', icon: PolicyIcon },
      { key: 'me-support', label: 'Support', path: '/me/support', icon: SupportAgentIcon },
      { key: 'me-tracker', label: 'My Tracker', path: '/me/tracker', icon: AccessTimeIcon },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    path: '/finance',
    role: ROLES.FINANCE,
    icon: AccountBalanceIcon,
    description: 'Invoices, billing & reimbursements',
    accent: '#0ea5e9',
    children: [
      { key: 'finance-invoices', label: 'Invoices', path: '/finance', icon: ReceiptLongIcon },
      { key: 'finance-expenses', label: 'Expense Claims', path: '/expenses', icon: ReceiptIcon },
    ],
  },
  {
    key: 'support',
    label: 'Support',
    path: '/support',
    role: ROLES.SUPPORT,
    icon: SupportAgentIcon,
    description: 'Employee support tickets',
    accent: '#e11d48',
  },
  {
    key: 'crm',
    label: 'CRM',
    path: '/crm',
    role: ROLES.CRM,
    icon: HubIcon,
    description: 'Leads & pipeline',
    accent: '#22c55e',
  },
  {
    key: 'products',
    label: 'Products',
    path: '/products',
    role: ROLES.PRODUCTS,
    icon: Inventory2Icon,
    description: 'Product catalog',
    accent: '#f97316',
  },
  {
    key: 'legal',
    label: 'Legal',
    path: '/legal',
    role: ROLES.LEGAL,
    icon: GavelIcon,
    description: 'Contracts & documents',
    accent: '#64748b',
    children: [
      { key: 'legal-dashboard', label: 'Dashboard', path: '/legal', icon: DashboardIcon },
      {
        key: 'legal-documents',
        label: 'Documents',
        path: '/legal/documents',
        icon: DescriptionIcon,
      },
      {
        key: 'legal-contracts',
        label: 'Legal',
        path: '/legal/contracts',
        icon: GavelIcon,
      },
      {
        key: 'legal-sign',
        label: 'Sign Board',
        path: '/legal/sign',
        icon: HistoryEduIcon,
      },
    ],
  },
  {
    key: 'hr',
    label: 'HR',
    path: '/hr',
    role: ROLES.HR,
    icon: EventAvailableIcon,
    description: 'Workforce, leave & attendance',
    accent: '#f59e0b',
    children: [
      { key: 'hr-dashboard', label: 'Dashboard', path: '/hr', icon: DashboardIcon },
      {
        key: 'hr-employees',
        label: 'Employee Records',
        path: '/hr/employees',
        icon: BadgeIcon,
      },
      {
        key: 'hr-leave',
        label: 'Leave Requests',
        path: '/hr/leave',
        icon: EventAvailableIcon,
      },
      {
        key: 'hr-attendance',
        label: 'Attendance',
        path: '/hr/attendance',
        icon: HowToRegIcon,
      },
      {
        key: 'hr-departments',
        label: 'Departments',
        path: '/hr/departments',
        icon: ApartmentIcon,
      },
      { key: 'hr-positions', label: 'Positions', path: '/hr/positions', icon: WorkIcon },
      { key: 'hr-locations', label: 'Locations', path: '/hr/locations', icon: PlaceIcon },
      { key: 'hr-teams', label: 'Teams', path: '/hr/teams', icon: GroupsIcon2 },
      { key: 'hr-grades', label: 'Grades', path: '/hr/grades', icon: MilitaryTechIcon },
      {
        key: 'hr-employment-types',
        label: 'Employment Types',
        path: '/hr/employment-types',
        icon: BadgeIcon,
      },
      { key: 'hr-shifts', label: 'Shifts', path: '/hr/shifts', icon: ScheduleIcon },
      { key: 'hr-exits', label: 'Exits', path: '/hr/exits', icon: LogoutIcon },
      { key: 'hr-holidays', label: 'Holidays', path: '/hr/holidays', icon: CelebrationIcon },
      {
        key: 'hr-leave-policies',
        label: 'Leave Policies',
        path: '/hr/leave-policies',
        icon: PolicyIcon,
      },
      {
        key: 'hr-leave-balances',
        label: 'Leave Balances',
        path: '/hr/leave-balances',
        icon: EventAvailableIcon,
      },
      { key: 'hr-requests', label: 'Requests', path: '/hr/requests', icon: AssignmentIcon },
      { key: 'hr-goals', label: 'Goals', path: '/hr/goals', icon: TrackChangesIcon },
      { key: 'hr-performance', label: 'Performance', path: '/hr/performance', icon: StarIcon },
      { key: 'hr-documents', label: 'Documents', path: '/hr/documents', icon: FolderIcon },
      { key: 'hr-benefits', label: 'Benefits', path: '/hr/benefits', icon: HealthAndSafetyIcon },
      { key: 'hr-training', label: 'Learning', path: '/hr/training', icon: SchoolIcon },
      {
        key: 'hr-announcements',
        label: 'Announcements',
        path: '/hr/announcements',
        icon: CampaignIcon,
      },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing',
    path: '/marketing',
    role: ROLES.MARKETING,
    icon: CampaignIcon,
    description: 'Campaigns',
    accent: '#ec4899',
  },
  {
    key: 'projects',
    label: 'Projects',
    path: '/projects',
    role: ROLES.PROJECTS,
    icon: AccountTreeIcon,
    description: 'Projects & bug tracking',
    accent: '#0d9488',
    children: [
      { key: 'projects-board', label: 'Projects', path: '/projects', icon: ViewKanbanIcon },
      { key: 'projects-bugs', label: 'Bugs', path: '/bugs', icon: BugReportIcon },
    ],
  },
  {
    key: 'admin',
    label: 'Admin',
    path: '/admin',
    role: ROLES.ADMIN,
    icon: AdminPanelSettingsIcon,
    description: 'Users, clients & settings',
    accent: '#155dfc',
    children: [
      { key: 'admin-users', label: 'Users', path: '/admin', icon: ManageAccountsIcon },
      { key: 'admin-clients', label: 'Clients', path: '/clients', icon: GroupsIcon },
      { key: 'admin-tech', label: 'Tech', path: '/tech', icon: TerminalIcon },
      {
        key: 'admin-branding',
        label: 'Branding',
        path: '/admin/branding',
        icon: PaletteIcon,
      },
    ],
  },
  {
    key: 'website',
    label: 'Website',
    path: '/website',
    role: ROLES.WEBSITE,
    icon: LanguageIcon,
    description: 'exyconn.com content & form submissions',
    accent: '#f97316',
    children: [
      {
        key: 'website-submissions',
        label: 'Form Submissions',
        path: '/website',
        icon: MarkEmailUnreadIcon,
      },
      { key: 'website-blog', label: 'Blog', path: '/website/blog', icon: ArticleIcon },
      {
        key: 'website-case-studies',
        label: 'Case Studies',
        path: '/website/case-studies',
        icon: MenuBookIcon,
      },
      {
        key: 'website-companies',
        label: 'Companies',
        path: '/website/companies',
        icon: ApartmentIcon,
      },
      { key: 'website-jobs', label: 'Jobs', path: '/website/jobs', icon: WorkIcon },
      {
        key: 'website-gigs',
        label: 'Freelance Gigs',
        path: '/website/gigs',
        icon: HandymanIcon,
      },
      {
        key: 'website-tool-categories',
        label: 'Tool Categories',
        path: '/website/tool-categories',
        icon: CategoryIcon,
      },
      { key: 'website-tools', label: 'Tools', path: '/website/tools', icon: BuildIcon },
      {
        key: 'website-nav-links',
        label: 'Navigation Links',
        path: '/website/nav-links',
        icon: LinkIcon,
      },
    ],
  },
  {
    key: 'ai',
    label: 'AI',
    path: '/ai',
    role: ROLES.AI,
    icon: SmartToyIcon,
    description: 'AI jobs & prompts',
    accent: '#6366f1',
    children: [
      { key: 'ai-dashboard', label: 'Dashboard', path: '/ai', icon: DashboardIcon },
      {
        key: 'ai-prompts',
        label: 'Prompt Library',
        path: '/ai/prompts',
        icon: AutoAwesomeIcon,
      },
    ],
  },
  {
    key: 'tracker',
    label: 'Time Tracker',
    path: '/tracker',
    role: ROLES.TRACKER,
    icon: AccessTimeIcon,
    description: 'Worked hours, activity & screenshots',
    accent: '#0ea5e9',
    children: [
      {
        key: 'tracker-dashboard',
        label: 'Dashboard',
        path: '/tracker',
        icon: DashboardIcon,
      },
      {
        key: 'tracker-access',
        label: 'Access',
        path: '/tracker/access',
        icon: VerifiedUserIcon,
      },
      {
        key: 'tracker-devices',
        label: 'Devices',
        path: '/tracker/devices',
        icon: DevicesIcon,
      },
      {
        key: 'tracker-settings',
        label: 'Settings',
        path: '/tracker/settings',
        icon: TuneIcon,
      },
    ],
  },
];

/** Returns only the modules the given roles may access. */
export function accessibleModules(roles: Role[]): ModuleDefinition[] {
  return MODULES.filter((m) => roles.includes(ROLES.ADMIN) || roles.includes(m.role));
}

/** First path segment -> the app that serves it, e.g. "me" and "profile" -> employee. */
const APP_BY_SEGMENT = new Map<string, PortalAppKey>(
  MODULES.flatMap((m) =>
    [m.path, ...(m.children ?? []).map((c) => c.path)].map(
      (path) => [path.split('/')[1], m.key] as [string, PortalAppKey],
    ),
  ),
);

/** Which micro-frontend serves a portal path. Undefined when nothing claims it. */
export function appForPath(path: string): PortalAppKey | undefined {
  return APP_BY_SEGMENT.get(path.split('/')[1]);
}

/** Link target for a nav entry: a path inside this app, else the other app's URL. */
export function moduleUrl(module: ModuleDefinition, path = module.path): string {
  return appUrl(module.key, path);
}
