import type { SvgIconComponent } from '@mui/icons-material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BugReportIcon from '@mui/icons-material/BugReport';
import GroupsIcon from '@mui/icons-material/Groups';
import BadgeIcon from '@mui/icons-material/Badge';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CampaignIcon from '@mui/icons-material/Campaign';
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
import { ROLES, type Role } from '../auth/roles';

/** A nested navigation entry shown under a parent module in the sidebar. */
export interface ModuleChild {
  key: string;
  label: string;
  path: string;
  icon: SvgIconComponent;
}

export interface ModuleDefinition {
  key: string;
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
 * Each top-level entry maps to exactly one role; `accessibleModules` filters by
 * the signed-in user's roles, so navigation is fully role-driven (dynamic).
 * Bugs is nested under Projects and Clients + Tech under Admin (consolidated).
 */
export const MODULES: ModuleDefinition[] = [
  {
    key: 'employee',
    label: 'My Workspace',
    path: '/portal/profile',
    role: ROLES.EMPLOYEE,
    icon: BadgeIcon,
    description: 'Payroll, leave, holidays & support',
    accent: '#14b8a6',
    children: [
      { key: 'me-profile', label: 'My Profile', path: '/portal/profile', icon: PersonIcon },
      { key: 'me-payroll', label: 'Payroll', path: '/portal/me/payroll', icon: PaymentsIcon },
      {
        key: 'me-salary-slips',
        label: 'Salary Slips',
        path: '/portal/me/salary-slips',
        icon: ReceiptLongIcon,
      },
      {
        key: 'me-leave',
        label: 'Leave Management',
        path: '/portal/me/leave',
        icon: EventAvailableIcon,
      },
      {
        key: 'me-attendance',
        label: 'My Attendance',
        path: '/portal/me/attendance',
        icon: HowToRegIcon,
      },
      { key: 'me-holidays', label: 'Holidays', path: '/portal/me/holidays', icon: CelebrationIcon },
      {
        key: 'me-calendar',
        label: 'Calendar',
        path: '/portal/me/calendar',
        icon: CalendarMonthIcon,
      },
      { key: 'me-policies', label: 'Policies', path: '/portal/me/policies', icon: PolicyIcon },
      { key: 'me-support', label: 'Support', path: '/portal/me/support', icon: SupportAgentIcon },
      { key: 'me-tracker', label: 'My Tracker', path: '/portal/me/tracker', icon: AccessTimeIcon },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    path: '/portal/finance',
    role: ROLES.FINANCE,
    icon: AccountBalanceIcon,
    description: 'Invoices & billing',
    accent: '#0ea5e9',
  },
  {
    key: 'support',
    label: 'Support',
    path: '/portal/support',
    role: ROLES.SUPPORT,
    icon: SupportAgentIcon,
    description: 'Employee support tickets',
    accent: '#e11d48',
  },
  {
    key: 'crm',
    label: 'CRM',
    path: '/portal/crm',
    role: ROLES.CRM,
    icon: HubIcon,
    description: 'Leads & pipeline',
    accent: '#22c55e',
  },
  {
    key: 'products',
    label: 'Products',
    path: '/portal/products',
    role: ROLES.PRODUCTS,
    icon: Inventory2Icon,
    description: 'Product catalog',
    accent: '#f97316',
  },
  {
    key: 'legal',
    label: 'Legal',
    path: '/portal/legal',
    role: ROLES.LEGAL,
    icon: GavelIcon,
    description: 'Contracts & documents',
    accent: '#64748b',
    children: [
      { key: 'legal-dashboard', label: 'Dashboard', path: '/portal/legal', icon: DashboardIcon },
      {
        key: 'legal-documents',
        label: 'Documents',
        path: '/portal/legal/documents',
        icon: DescriptionIcon,
      },
      {
        key: 'legal-contracts',
        label: 'Legal',
        path: '/portal/legal/contracts',
        icon: GavelIcon,
      },
      {
        key: 'legal-sign',
        label: 'Sign Board',
        path: '/portal/legal/sign',
        icon: HistoryEduIcon,
      },
    ],
  },
  {
    key: 'hr',
    label: 'HR',
    path: '/portal/hr',
    role: ROLES.HR,
    icon: EventAvailableIcon,
    description: 'Workforce, leave & attendance',
    accent: '#f59e0b',
    children: [
      { key: 'hr-dashboard', label: 'Dashboard', path: '/portal/hr', icon: DashboardIcon },
      {
        key: 'hr-employees',
        label: 'Employee Records',
        path: '/portal/hr/employees',
        icon: BadgeIcon,
      },
      {
        key: 'hr-leave',
        label: 'Leave Requests',
        path: '/portal/hr/leave',
        icon: EventAvailableIcon,
      },
      {
        key: 'hr-attendance',
        label: 'Attendance',
        path: '/portal/hr/attendance',
        icon: HowToRegIcon,
      },
      {
        key: 'hr-departments',
        label: 'Departments',
        path: '/portal/hr/departments',
        icon: ApartmentIcon,
      },
      { key: 'hr-positions', label: 'Positions', path: '/portal/hr/positions', icon: WorkIcon },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing',
    path: '/portal/marketing',
    role: ROLES.MARKETING,
    icon: CampaignIcon,
    description: 'Campaigns',
    accent: '#ec4899',
  },
  {
    key: 'projects',
    label: 'Projects',
    path: '/portal/projects',
    role: ROLES.PROJECTS,
    icon: AccountTreeIcon,
    description: 'Projects & bug tracking',
    accent: '#0d9488',
    children: [
      { key: 'projects-board', label: 'Projects', path: '/portal/projects', icon: ViewKanbanIcon },
      { key: 'projects-bugs', label: 'Bugs', path: '/portal/bugs', icon: BugReportIcon },
    ],
  },
  {
    key: 'admin',
    label: 'Admin',
    path: '/portal/admin',
    role: ROLES.ADMIN,
    icon: AdminPanelSettingsIcon,
    description: 'Users, clients & settings',
    accent: '#155dfc',
    children: [
      { key: 'admin-users', label: 'Users', path: '/portal/admin', icon: ManageAccountsIcon },
      { key: 'admin-clients', label: 'Clients', path: '/portal/clients', icon: GroupsIcon },
      { key: 'admin-tech', label: 'Tech', path: '/portal/tech', icon: TerminalIcon },
      {
        key: 'admin-branding',
        label: 'Branding',
        path: '/portal/admin/branding',
        icon: PaletteIcon,
      },
    ],
  },
  {
    key: 'website',
    label: 'Website',
    path: '/portal/website',
    role: ROLES.WEBSITE,
    icon: LanguageIcon,
    description: 'exyconn.com content & form submissions',
    accent: '#f97316',
    children: [
      {
        key: 'website-submissions',
        label: 'Form Submissions',
        path: '/portal/website',
        icon: MarkEmailUnreadIcon,
      },
      { key: 'website-blog', label: 'Blog', path: '/portal/website/blog', icon: ArticleIcon },
      {
        key: 'website-case-studies',
        label: 'Case Studies',
        path: '/portal/website/case-studies',
        icon: MenuBookIcon,
      },
      {
        key: 'website-companies',
        label: 'Companies',
        path: '/portal/website/companies',
        icon: ApartmentIcon,
      },
      { key: 'website-jobs', label: 'Jobs', path: '/portal/website/jobs', icon: WorkIcon },
      {
        key: 'website-gigs',
        label: 'Freelance Gigs',
        path: '/portal/website/gigs',
        icon: HandymanIcon,
      },
      {
        key: 'website-tool-categories',
        label: 'Tool Categories',
        path: '/portal/website/tool-categories',
        icon: CategoryIcon,
      },
      { key: 'website-tools', label: 'Tools', path: '/portal/website/tools', icon: BuildIcon },
      {
        key: 'website-nav-links',
        label: 'Navigation Links',
        path: '/portal/website/nav-links',
        icon: LinkIcon,
      },
    ],
  },
  {
    key: 'ai',
    label: 'AI',
    path: '/portal/ai',
    role: ROLES.AI,
    icon: SmartToyIcon,
    description: 'AI jobs & prompts',
    accent: '#6366f1',
    children: [
      { key: 'ai-dashboard', label: 'Dashboard', path: '/portal/ai', icon: DashboardIcon },
      {
        key: 'ai-prompts',
        label: 'Prompt Library',
        path: '/portal/ai/prompts',
        icon: AutoAwesomeIcon,
      },
    ],
  },
  {
    key: 'tracker',
    label: 'Time Tracker',
    path: '/portal/tracker',
    role: ROLES.TRACKER,
    icon: AccessTimeIcon,
    description: 'Worked hours, activity & screenshots',
    accent: '#0ea5e9',
    children: [
      {
        key: 'tracker-dashboard',
        label: 'Dashboard',
        path: '/portal/tracker',
        icon: DashboardIcon,
      },
      {
        key: 'tracker-access',
        label: 'Access',
        path: '/portal/tracker/access',
        icon: VerifiedUserIcon,
      },
      {
        key: 'tracker-devices',
        label: 'Devices',
        path: '/portal/tracker/devices',
        icon: DevicesIcon,
      },
      {
        key: 'tracker-settings',
        label: 'Settings',
        path: '/portal/tracker/settings',
        icon: TuneIcon,
      },
    ],
  },
];

/** Returns only the modules the given roles may access. */
export function accessibleModules(roles: Role[]): ModuleDefinition[] {
  return MODULES.filter((m) => roles.includes(ROLES.ADMIN) || roles.includes(m.role));
}
