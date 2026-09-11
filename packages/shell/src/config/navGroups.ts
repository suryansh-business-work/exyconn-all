import type { SvgIconComponent } from '@mui/icons-material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ArticleIcon from '@mui/icons-material/Article';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BusinessIcon from '@mui/icons-material/Business';
import CampaignIcon from '@mui/icons-material/Campaign';
import ContactsIcon from '@mui/icons-material/Contacts';
import DescriptionIcon from '@mui/icons-material/Description';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import EngineeringIcon from '@mui/icons-material/Engineering';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventNoteIcon from '@mui/icons-material/EventNote';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import GroupsIcon from '@mui/icons-material/Groups';
import LanguageIcon from '@mui/icons-material/Language';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import PaymentsIcon from '@mui/icons-material/Payments';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SettingsIcon from '@mui/icons-material/Settings';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TuneIcon from '@mui/icons-material/Tune';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';

/**
 * The icon each sidebar section wears. The collapsed rail shows one icon per section
 * instead of every page inside it, so a section without an icon has nothing to show there —
 * which is why `NavGroup` is derived from this map: a new section fails to compile until it
 * is given one.
 */
export const NAV_GROUP_ICONS = {
  Administration: AdminPanelSettingsIcon,
  Billing: ReceiptIcon,
  Communication: CampaignIcon,
  Configuration: TuneIcon,
  Content: ArticleIcon,
  Directory: ContactsIcon,
  Growth: TrendingUpIcon,
  'Hiring & onboarding': PersonAddIcon,
  'My record': FolderSharedIcon,
  Operations: EngineeringIcon,
  'Pay & money': AccountBalanceWalletIcon,
  Pay: PaymentsIcon,
  People: GroupsIcon,
  Pipeline: ViewKanbanIcon,
  Planning: EventNoteIcon,
  Records: DescriptionIcon,
  Releases: NewReleasesIcon,
  Requests: AssignmentIcon,
  Site: LanguageIcon,
  Spend: ShoppingCartIcon,
  System: SettingsIcon,
  'Team & company': BusinessIcon,
  'The team': Diversity3Icon,
  'Time & attendance': ScheduleIcon,
  'Time & leave': EventAvailableIcon,
} satisfies Record<string, SvgIconComponent>;

export type NavGroup = keyof typeof NAV_GROUP_ICONS;
