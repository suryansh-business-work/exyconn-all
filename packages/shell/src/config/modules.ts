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
import EventNoteIcon from '@mui/icons-material/EventNote';
import HandshakeIcon from '@mui/icons-material/Handshake';
import BusinessIcon from '@mui/icons-material/Business';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import InventoryIcon from '@mui/icons-material/Inventory2';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import ChecklistIcon from '@mui/icons-material/Checklist';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import PersonIcon from '@mui/icons-material/Person';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PlaceIcon from '@mui/icons-material/Place';
import GroupsIcon2 from '@mui/icons-material/Diversity3';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LogoutIcon from '@mui/icons-material/Logout';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PaidIcon from '@mui/icons-material/Paid';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import HistoryIcon from '@mui/icons-material/History';
import WorkIcon from '@mui/icons-material/Work';
import DescriptionIcon from '@mui/icons-material/Description';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PaymentsIcon from '@mui/icons-material/Payments';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WebhookIcon from '@mui/icons-material/Webhook';
import PolicyIcon from '@mui/icons-material/Policy';
import CelebrationIcon from '@mui/icons-material/Celebration';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import TableRowsIcon from '@mui/icons-material/TableRows';
import LanguageIcon from '@mui/icons-material/Language';
import ArticleIcon from '@mui/icons-material/Article';
import BlockIcon from '@mui/icons-material/Block';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HandymanIcon from '@mui/icons-material/Handyman';
import CategoryIcon from '@mui/icons-material/Category';
import BuildIcon from '@mui/icons-material/Build';
import LinkIcon from '@mui/icons-material/Link';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import DevicesIcon from '@mui/icons-material/Devices';
import DownloadIcon from '@mui/icons-material/Download';
import TuneIcon from '@mui/icons-material/Tune';
import PercentIcon from '@mui/icons-material/Percent';
import TranslateIcon from '@mui/icons-material/Translate';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import DnsIcon from '@mui/icons-material/Dns';
import ScheduleSendIcon from '@mui/icons-material/ScheduleSend';
import PaletteIcon from '@mui/icons-material/Palette';
import SavingsIcon from '@mui/icons-material/Savings';
import QuickreplyIcon from '@mui/icons-material/Quickreply';
import ForumIcon from '@mui/icons-material/Forum';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';
import { ROLES, type Role } from '@/auth/roles';
import { appUrl, type PortalAppKey } from './apps';
import type { NavGroup } from './navGroups';
import { color } from '@exyconn/ui';

/** A nested navigation entry shown under a parent module in the sidebar. */
export interface ModuleChild {
  key: string;
  label: string;
  path: string;
  icon: SvgIconComponent;
  /**
   * Section this page belongs to in the sidebar.
   *
   * Optional, and deliberately so: a module with a handful of pages reads better as a plain
   * list than as three headings with two items under each. Children with no group lead the
   * list, ungrouped — that is where a module's overview and its most-used page belong.
   */
  group?: NavGroup;
  /**
   * Pages nested under this one. The sidebar draws at most `MAX_NAV_DEPTH` levels, counted
   * from its top level: a section, then this page, then its children and theirs.
   */
  children?: ModuleChild[];
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
 * Bugs is nested under Projects and Clients under Admin; Tech owns the
 * integration credentials and the desktop tracker builds.
 */
export const MODULES: ModuleDefinition[] = [
  {
    key: 'employee',
    label: 'My Workspace',
    path: '/me',
    role: ROLES.EMPLOYEE,
    icon: BadgeIcon,
    description: 'Everything you need day to day',
    accent: color.teal[500],
    children: [
      { key: 'me-dashboard', label: 'Dashboard', path: '/me', icon: DashboardIcon },
      { key: 'me-profile', label: 'My Profile', path: '/profile', icon: PersonIcon },
      {
        key: 'me-leave',
        label: 'Leave Management',
        path: '/me/leave',
        icon: EventAvailableIcon,
        group: 'Time & leave',
      },
      {
        key: 'me-attendance',
        label: 'My Attendance',
        path: '/me/attendance',
        icon: HowToRegIcon,
        group: 'Time & leave',
      },
      {
        key: 'me-holidays',
        label: 'Holidays',
        path: '/me/holidays',
        icon: CelebrationIcon,
        group: 'Time & leave',
      },
      {
        key: 'me-calendar',
        label: 'Calendar',
        path: '/me/calendar',
        icon: CalendarMonthIcon,
        group: 'Time & leave',
      },
      {
        key: 'me-tracker',
        label: 'My Tracker',
        path: '/me/tracker',
        icon: AccessTimeIcon,
        group: 'Time & leave',
      },
      {
        key: 'me-requests',
        label: 'My Requests',
        path: '/me/requests',
        icon: AssignmentIcon,
        group: 'Requests',
      },
      {
        key: 'me-approvals',
        label: 'My Approvals',
        path: '/me/approvals',
        icon: FactCheckIcon,
        group: 'Requests',
      },
      {
        key: 'me-support',
        label: 'Support',
        path: '/me/support',
        icon: SupportAgentIcon,
        group: 'Requests',
      },
      {
        key: 'me-payroll',
        label: 'Payroll',
        path: '/me/payroll',
        icon: PaymentsIcon,
        group: 'Pay & money',
      },
      {
        key: 'me-salary-slips',
        label: 'Salary Slips',
        path: '/me/salary-slips',
        icon: ReceiptLongIcon,
        group: 'Pay & money',
      },
      {
        key: 'me-expenses',
        label: 'Expenses',
        path: '/me/expenses',
        icon: ReceiptIcon,
        group: 'Pay & money',
      },
      {
        key: 'me-benefits',
        label: 'Benefits',
        path: '/me/benefits',
        icon: HealthAndSafetyIcon,
        group: 'Pay & money',
      },
      {
        key: 'me-goals',
        label: 'Goals',
        path: '/me/goals',
        icon: TrackChangesIcon,
        group: 'Growth',
      },
      {
        key: 'me-performance',
        label: 'Performance',
        path: '/me/performance',
        icon: StarIcon,
        group: 'Growth',
      },
      {
        key: 'me-training',
        label: 'Learning',
        path: '/me/training',
        icon: SchoolIcon,
        group: 'Growth',
      },
      {
        key: 'me-team',
        label: 'My Team',
        path: '/me/team',
        icon: GroupsIcon,
        group: 'Team & company',
      },
      {
        key: 'me-announcements',
        label: 'Announcements',
        path: '/me/announcements',
        icon: CampaignIcon,
        group: 'Team & company',
      },
      {
        key: 'me-notifications',
        label: 'Notifications',
        path: '/me/notifications',
        icon: NotificationsIcon,
        group: 'Team & company',
      },
      {
        key: 'me-policies',
        label: 'Policies',
        path: '/me/policies',
        icon: PolicyIcon,
        group: 'Team & company',
      },
      {
        key: 'me-onboarding',
        label: 'My Onboarding',
        path: '/me/onboarding',
        icon: ChecklistIcon,
        group: 'My record',
      },
      {
        key: 'me-documents',
        label: 'My Documents',
        path: '/me/documents',
        icon: FolderIcon,
        group: 'My record',
      },
      { key: 'me-exit', label: 'Exit', path: '/me/exit', icon: LogoutIcon, group: 'My record' },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    path: '/finance',
    role: ROLES.FINANCE,
    icon: AccountBalanceIcon,
    description: 'Invoices, spend, cash & reimbursements',
    accent: color.sky[500],
    children: [
      { key: 'finance-overview', label: 'Overview', path: '/finance', icon: DashboardIcon },
      {
        key: 'finance-invoices',
        label: 'Invoices',
        path: '/finance/invoices',
        icon: ReceiptLongIcon,
        group: 'Billing',
      },
      {
        key: 'finance-recurring',
        label: 'Recurring invoices',
        path: '/finance/recurring',
        icon: EventRepeatIcon,
        group: 'Billing',
      },
      {
        key: 'finance-payments',
        label: 'Payments',
        path: '/finance/payments',
        icon: PaymentsIcon,
        group: 'Billing',
      },
      {
        key: 'finance-receivables',
        label: 'Receivables',
        path: '/finance/receivables',
        icon: TrendingUpIcon,
        group: 'Billing',
      },
      {
        key: 'finance-company-expenses',
        label: 'Company Expenses',
        path: '/finance/company-expenses',
        icon: StorefrontIcon,
        group: 'Spend',
      },
      {
        key: 'finance-expenses',
        label: 'Expense Claims',
        path: '/expenses',
        icon: ReceiptIcon,
        group: 'Spend',
      },
      {
        key: 'finance-cost-centres',
        label: 'Cost Centres',
        path: '/finance/cost-centres',
        icon: AccountTreeIcon,
        group: 'Planning',
      },
      {
        key: 'finance-budgets',
        label: 'Budgets',
        path: '/finance/budgets',
        icon: SavingsIcon,
        group: 'Planning',
      },
      {
        key: 'finance-budget-variance',
        label: 'Budget vs Actual',
        path: '/finance/budget-variance',
        icon: AssessmentIcon,
        group: 'Planning',
      },
    ],
  },
  {
    key: 'support',
    label: 'Support',
    path: '/support',
    role: ROLES.SUPPORT,
    icon: SupportAgentIcon,
    description: 'Employee & customer support tickets',
    accent: color.rose[500],
    children: [
      { key: 'support-overview', label: 'Overview', path: '/support', icon: DashboardIcon },
      {
        key: 'support-tickets',
        label: 'Tickets',
        path: '/support/tickets',
        icon: SupportAgentIcon,
      },
      { key: 'support-sla', label: 'SLA Policies', path: '/support/sla', icon: ScheduleIcon },
      {
        key: 'support-knowledge-base',
        label: 'Knowledge Base',
        path: '/support/knowledge-base',
        icon: MenuBookIcon,
      },
      {
        key: 'support-canned-replies',
        label: 'Canned Replies',
        path: '/support/canned-replies',
        icon: QuickreplyIcon,
      },
    ],
  },
  {
    key: 'crm',
    label: 'CRM',
    path: '/crm',
    role: ROLES.CRM,
    icon: HubIcon,
    description: 'Leads & pipeline',
    accent: color.green[500],
    children: [
      { key: 'crm-overview', label: 'Overview', path: '/crm', icon: DashboardIcon },
      {
        key: 'crm-leads',
        label: 'Leads',
        path: '/crm/leads',
        icon: ContactPhoneIcon,
        group: 'Pipeline',
      },
      {
        key: 'crm-deals',
        label: 'Deals',
        path: '/crm/deals',
        icon: HandshakeIcon,
        group: 'Pipeline',
      },
      {
        key: 'crm-deals-list',
        label: 'Deals List',
        path: '/crm/deals/list',
        icon: TableRowsIcon,
        group: 'Pipeline',
      },
      {
        key: 'crm-activities',
        label: 'Activities',
        path: '/crm/activities',
        icon: EventNoteIcon,
        group: 'Pipeline',
      },
      {
        key: 'crm-companies',
        label: 'Companies',
        path: '/crm/companies',
        icon: BusinessIcon,
        group: 'Directory',
      },
      {
        key: 'crm-contacts',
        label: 'Contacts',
        path: '/crm/contacts',
        icon: PersonIcon,
        group: 'Directory',
      },
    ],
  },
  {
    key: 'products',
    label: 'Products',
    path: '/products',
    role: ROLES.PRODUCTS,
    icon: Inventory2Icon,
    description: 'Product catalog',
    accent: color.orange[600],
    children: [
      { key: 'products-overview', label: 'Overview', path: '/products', icon: DashboardIcon },
      {
        key: 'products-catalogue',
        label: 'Catalogue',
        path: '/products/catalogue',
        icon: InventoryIcon,
      },
      {
        key: 'products-suppliers',
        label: 'Suppliers',
        path: '/products/suppliers',
        icon: BusinessIcon,
      },
      {
        key: 'products-purchase-orders',
        label: 'Purchase orders',
        path: '/products/purchase-orders',
        icon: ShoppingCartIcon,
      },
      { key: 'products-stock', label: 'Stock', path: '/products/stock', icon: BuildIcon },
    ],
  },
  {
    key: 'legal',
    label: 'Legal',
    path: '/legal',
    role: ROLES.LEGAL,
    icon: GavelIcon,
    description: 'Contracts, policies & documents',
    accent: color.slate[500],
    children: [
      { key: 'legal-dashboard', label: 'Dashboard', path: '/legal', icon: DashboardIcon },
      { key: 'legal-policies', label: 'Policies', path: '/legal/policies', icon: PolicyIcon },
      {
        key: 'legal-documents',
        label: 'Documents',
        path: '/legal/documents',
        icon: DescriptionIcon,
      },
      {
        key: 'legal-contracts',
        label: 'Contracts',
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
    accent: color.amber[500],
    children: [
      { key: 'hr-dashboard', label: 'Dashboard', path: '/hr', icon: DashboardIcon },
      { key: 'hr-reports', label: 'Reports', path: '/hr/reports', icon: AssessmentIcon },
      {
        key: 'hr-employees',
        label: 'Employee Records',
        path: '/hr/employees',
        icon: BadgeIcon,
        group: 'People',
      },
      {
        key: 'hr-org-chart',
        label: 'Org Chart',
        path: '/hr/org-chart',
        icon: AccountTreeIcon,
        group: 'People',
      },
      {
        key: 'hr-departments',
        label: 'Departments',
        path: '/hr/departments',
        icon: ApartmentIcon,
        group: 'People',
      },
      {
        key: 'hr-positions',
        label: 'Positions',
        path: '/hr/positions',
        icon: WorkIcon,
        group: 'People',
      },
      {
        key: 'hr-locations',
        label: 'Locations',
        path: '/hr/locations',
        icon: PlaceIcon,
        group: 'People',
      },
      { key: 'hr-teams', label: 'Teams', path: '/hr/teams', icon: GroupsIcon2, group: 'People' },
      {
        key: 'hr-grades',
        label: 'Grades',
        path: '/hr/grades',
        icon: MilitaryTechIcon,
        group: 'People',
      },
      {
        key: 'hr-employment-types',
        label: 'Employment Types',
        path: '/hr/employment-types',
        icon: BadgeIcon,
        group: 'People',
      },
      {
        key: 'hr-onboarding',
        label: 'Onboarding',
        path: '/hr/onboarding',
        icon: ChecklistIcon,
        group: 'Hiring & onboarding',
      },
      {
        key: 'hr-onboarding-templates',
        label: 'Onboarding Templates',
        path: '/hr/onboarding-templates',
        icon: PlaylistAddCheckIcon,
        group: 'Hiring & onboarding',
      },
      {
        key: 'hr-applicants',
        label: 'Applicants',
        path: '/hr/applicants',
        icon: HowToRegIcon,
        group: 'Hiring & onboarding',
      },
      {
        key: 'hr-leave',
        label: 'Leave Requests',
        path: '/hr/leave',
        icon: EventAvailableIcon,
        group: 'Time & attendance',
      },
      {
        key: 'hr-attendance',
        label: 'Attendance',
        path: '/hr/attendance',
        icon: HowToRegIcon,
        group: 'Time & attendance',
      },
      {
        key: 'hr-shifts',
        label: 'Shifts',
        path: '/hr/shifts',
        icon: ScheduleIcon,
        group: 'Time & attendance',
      },
      {
        key: 'hr-holidays',
        label: 'Holidays',
        path: '/hr/holidays',
        icon: CelebrationIcon,
        group: 'Time & attendance',
      },
      {
        key: 'hr-leave-policies',
        label: 'Leave Policies',
        path: '/hr/leave-policies',
        icon: PolicyIcon,
        group: 'Time & attendance',
      },
      {
        key: 'hr-leave-balances',
        label: 'Leave Balances',
        path: '/hr/leave-balances',
        icon: EventAvailableIcon,
        group: 'Time & attendance',
      },
      {
        key: 'hr-salaries',
        label: 'Salaries',
        path: '/hr/salaries',
        icon: PaymentsIcon,
        group: 'Pay',
      },
      { key: 'hr-payroll', label: 'Payroll', path: '/hr/payroll', icon: PaidIcon, group: 'Pay' },
      {
        key: 'hr-payslip-schedule',
        label: 'Payslip Schedule',
        path: '/hr/payslip-schedule',
        icon: ScheduleSendIcon,
        group: 'Pay',
      },
      {
        key: 'hr-payroll-settings',
        label: 'Payroll Settings',
        path: '/hr/payroll-settings',
        icon: TuneIcon,
        group: 'Pay',
      },
      {
        key: 'hr-tax-slabs',
        label: 'Tax Slabs',
        path: '/hr/tax-slabs',
        icon: PercentIcon,
        group: 'Pay',
      },
      {
        key: 'hr-goals',
        label: 'Goals',
        path: '/hr/goals',
        icon: TrackChangesIcon,
        group: 'Growth',
      },
      {
        key: 'hr-performance',
        label: 'Performance',
        path: '/hr/performance',
        icon: StarIcon,
        group: 'Growth',
      },
      {
        key: 'hr-benefits',
        label: 'Benefits',
        path: '/hr/benefits',
        icon: HealthAndSafetyIcon,
        group: 'Growth',
      },
      {
        key: 'hr-training',
        label: 'Learning',
        path: '/hr/training',
        icon: SchoolIcon,
        group: 'Growth',
      },
      { key: 'hr-exits', label: 'Exits', path: '/hr/exits', icon: LogoutIcon, group: 'Records' },
      {
        key: 'hr-requests',
        label: 'Requests',
        path: '/hr/requests',
        icon: AssignmentIcon,
        group: 'Records',
      },
      {
        key: 'hr-documents',
        label: 'Documents',
        path: '/hr/documents',
        icon: FolderIcon,
        group: 'Records',
      },
      {
        key: 'hr-notify',
        label: 'Send Notification',
        path: '/hr/notify',
        icon: NotificationsIcon,
        group: 'Communication',
      },
      {
        key: 'hr-announcements',
        label: 'Announcements',
        path: '/hr/announcements',
        icon: CampaignIcon,
        group: 'Communication',
      },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing',
    path: '/marketing',
    role: ROLES.MARKETING,
    icon: CampaignIcon,
    description: 'Campaigns & audiences',
    accent: color.pink[400],
    children: [
      { key: 'marketing-overview', label: 'Overview', path: '/marketing', icon: DashboardIcon },
      {
        key: 'marketing-campaigns',
        label: 'Campaigns',
        path: '/marketing/campaigns',
        icon: CampaignIcon,
      },
      {
        key: 'marketing-audiences',
        label: 'Audiences',
        path: '/marketing/audiences',
        icon: GroupsIcon,
      },
      {
        key: 'marketing-suppression',
        label: 'Suppression List',
        path: '/marketing/suppression',
        icon: BlockIcon,
      },
    ],
  },
  {
    key: 'projects',
    label: 'Projects',
    path: '/projects',
    role: ROLES.PROJECTS,
    icon: AccountTreeIcon,
    description: 'Projects & bug tracking',
    accent: color.teal[600],
    children: [
      { key: 'projects-overview', label: 'Overview', path: '/projects', icon: DashboardIcon },
      { key: 'projects-board', label: 'Projects', path: '/projects/list', icon: ViewKanbanIcon },
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
    accent: color.blue[600],
    children: [
      { key: 'admin-overview', label: 'Overview', path: '/admin', icon: DashboardIcon },
      { key: 'admin-users', label: 'Users', path: '/admin/users', icon: ManageAccountsIcon },
      { key: 'admin-clients', label: 'Clients', path: '/clients', icon: GroupsIcon },
      {
        key: 'admin-permissions',
        label: 'Roles & Permissions',
        path: '/admin/permissions',
        icon: LockPersonIcon,
      },
      {
        key: 'admin-branding',
        label: 'Branding',
        path: '/admin/branding',
        icon: PaletteIcon,
        group: 'Configuration',
      },
      {
        key: 'admin-app-settings',
        label: 'App Settings',
        path: '/admin/settings',
        icon: TuneIcon,
        group: 'Configuration',
      },
      {
        key: 'admin-localization',
        label: 'Localization',
        path: '/admin/localization',
        icon: TranslateIcon,
        group: 'Configuration',
      },
      {
        key: 'admin-audit',
        label: 'Audit Log',
        path: '/admin/audit',
        icon: HistoryIcon,
        group: 'System',
      },
      {
        key: 'admin-integrations',
        label: 'Integrations',
        path: '/admin/integrations',
        icon: WebhookIcon,
        group: 'System',
      },
      {
        key: 'admin-health',
        label: 'System Health',
        path: '/admin/health',
        icon: MonitorHeartIcon,
        group: 'System',
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
    accent: color.orange[600],
    children: [
      { key: 'website-overview', label: 'Overview', path: '/website', icon: DashboardIcon },
      {
        key: 'website-submissions',
        label: 'Form Submissions',
        path: '/website/submissions',
        icon: MarkEmailUnreadIcon,
      },
      {
        key: 'website-blog',
        label: 'Blog',
        path: '/website/blog',
        icon: ArticleIcon,
        group: 'Content',
      },
      {
        key: 'website-case-studies',
        label: 'Case Studies',
        path: '/website/case-studies',
        icon: MenuBookIcon,
        group: 'Content',
      },
      {
        key: 'website-jobs',
        label: 'Jobs',
        path: '/website/jobs',
        icon: WorkIcon,
        group: 'Content',
      },
      {
        key: 'website-gigs',
        label: 'Freelance Gigs',
        path: '/website/gigs',
        icon: HandymanIcon,
        group: 'Content',
      },
      {
        key: 'website-companies',
        label: 'Companies',
        path: '/website/companies',
        icon: ApartmentIcon,
        group: 'Directory',
      },
      {
        key: 'website-tool-categories',
        label: 'Tool Categories',
        path: '/website/tool-categories',
        icon: CategoryIcon,
        group: 'Directory',
      },
      {
        key: 'website-tools',
        label: 'Tools',
        path: '/website/tools',
        icon: BuildIcon,
        group: 'Directory',
      },
      {
        key: 'website-nav-links',
        label: 'Navigation Links',
        path: '/website/nav-links',
        icon: LinkIcon,
        group: 'Site',
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
    accent: color.indigo[400],
    children: [
      { key: 'ai-overview', label: 'Overview', path: '/ai', icon: DashboardIcon },
      { key: 'ai-jobs', label: 'Jobs', path: '/ai/jobs', icon: DashboardIcon },
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
    accent: color.sky[500],
    children: [
      { key: 'tracker-overview', label: 'Overview', path: '/tracker', icon: DashboardIcon },
      {
        key: 'tracker-activity',
        label: 'Activity',
        path: '/tracker/activity',
        icon: AccessTimeIcon,
      },
      {
        key: 'tracker-access',
        label: 'Access',
        path: '/tracker/access',
        icon: VerifiedUserIcon,
        group: 'The team',
      },
      {
        key: 'tracker-devices',
        label: 'Devices',
        path: '/tracker/devices',
        icon: DevicesIcon,
        group: 'The team',
      },
      {
        key: 'tracker-approvals',
        label: 'Off-computer time',
        path: '/tracker/approvals',
        icon: FactCheckIcon,
        group: 'The team',
      },
      {
        key: 'tracker-messages',
        label: 'Messages',
        path: '/tracker/messages',
        icon: ForumIcon,
        group: 'The team',
      },
      {
        key: 'tracker-billing',
        label: 'Billing',
        path: '/tracker/billing',
        icon: PaymentsIcon,
        group: 'Administration',
      },
      {
        key: 'tracker-download',
        label: 'Download',
        path: '/tracker/download',
        icon: DownloadIcon,
        group: 'Administration',
      },
      {
        key: 'tracker-settings',
        label: 'Settings',
        path: '/tracker/settings',
        icon: TuneIcon,
        group: 'Administration',
      },
    ],
  },
  {
    key: 'tech',
    label: 'Tech',
    path: '/tech',
    role: ROLES.TECH,
    icon: TerminalIcon,
    description: 'Integrations, email & desktop builds',
    accent: color.violet[500],
    children: [
      { key: 'tech-overview', label: 'Overview', path: '/tech', icon: DashboardIcon },
      {
        key: 'tech-env-vars',
        label: 'Environment Variables',
        path: '/tech/environment-variables',
        icon: TerminalIcon,
        group: 'Configuration',
      },
      {
        key: 'tech-email',
        label: 'Email',
        path: '/tech/email',
        icon: MarkEmailReadIcon,
        group: 'Configuration',
      },
      {
        key: 'tech-settings',
        label: 'Settings',
        path: '/tech/settings',
        icon: TuneIcon,
        group: 'Configuration',
      },
      {
        key: 'tech-problem-reports',
        label: 'Problem Reports',
        path: '/tech/problem-reports',
        icon: ReportProblemIcon,
        group: 'Operations',
      },
      {
        key: 'tech-infrastructure',
        label: 'Infrastructure',
        path: '/tech/infrastructure',
        icon: DnsIcon,
        group: 'Operations',
      },
      {
        key: 'tech-status-monitors',
        label: 'Status Monitors',
        path: '/tech/status-monitors',
        icon: MonitorHeartIcon,
        group: 'Operations',
      },
      {
        key: 'tech-incidents',
        label: 'Incidents',
        path: '/tech/incidents',
        icon: ReportProblemIcon,
        group: 'Operations',
      },
      {
        key: 'tech-logs',
        label: 'Logs',
        path: '/tech/logs',
        icon: BugReportIcon,
        group: 'Operations',
      },
      {
        key: 'tech-tracker-build',
        label: 'Tracker Build',
        path: '/tech/tracker-build',
        icon: BuildIcon,
        group: 'Releases',
      },
    ],
  },
  {
    key: 'it',
    label: 'IT',
    path: '/it',
    role: ROLES.IT,
    icon: DevicesIcon,
    description: 'Company hardware & licences',
    accent: color.cyan[600],
    children: [
      { key: 'it-overview', label: 'Overview', path: '/it', icon: DashboardIcon },
      { key: 'it-assets', label: 'Assets', path: '/it/assets', icon: InventoryIcon },
      { key: 'it-licences', label: 'Licences', path: '/it/licences', icon: VpnKeyIcon },
    ],
  },
  {
    // Everyone's, deliberately: this one is keyed to EMPLOYEE rather than a role of its
    // own, because a company feed half the company cannot open is a noticeboard.
    key: 'social',
    label: 'Social',
    path: '/social',
    role: ROLES.EMPLOYEE,
    icon: ForumIcon,
    description: 'The internal employee feed',
    accent: color.violet[500],
    children: [
      { key: 'social-feed', label: 'Feed', path: '/social', icon: DynamicFeedIcon },
      { key: 'social-profile', label: 'My Profile', path: '/social/me', icon: PersonIcon },
    ],
  },
];

/** Returns only the modules the given roles may access. */
export function accessibleModules(roles: Role[]): ModuleDefinition[] {
  return MODULES.filter((m) => roles.includes(ROLES.ADMIN) || roles.includes(m.role));
}

/** Every path under a list of children, however deeply they nest. */
function childPaths(children: ModuleChild[] = []): string[] {
  return children.flatMap((c) => [c.path, ...childPaths(c.children)]);
}

/** First path segment -> the app that serves it, e.g. "me" and "profile" -> employee. */
const APP_BY_SEGMENT = new Map<string, PortalAppKey>(
  MODULES.flatMap((m) =>
    [m.path, ...childPaths(m.children)].map(
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
