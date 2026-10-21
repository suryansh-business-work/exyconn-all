import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import ReceiptIcon from '@mui/icons-material/ReceiptLong';
import PaymentsIcon from '@mui/icons-material/Payments';
import SupportIcon from '@mui/icons-material/SupportAgent';
import FolderIcon from '@mui/icons-material/FolderOpen';
import LinkIcon from '@mui/icons-material/Link';
import ForumIcon from '@mui/icons-material/ForumOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import { PATHS } from '../paths';

/** The client hub's sections, in the order a client looks for them. */
export const CLIENT_NAV = [
  { to: PATHS.dashboard, label: 'Overview', icon: <DashboardIcon fontSize="small" /> },
  { to: PATHS.invoices, label: 'Invoices', icon: <ReceiptIcon fontSize="small" /> },
  { to: PATHS.transactions, label: 'Transactions', icon: <PaymentsIcon fontSize="small" /> },
  { to: PATHS.support, label: 'Support', icon: <SupportIcon fontSize="small" /> },
  { to: PATHS.projects, label: 'Projects', icon: <FolderIcon fontSize="small" /> },
  {
    to: PATHS.documents,
    label: 'Contracts & documents',
    icon: <DescriptionIcon fontSize="small" />,
  },
  { to: PATHS.communications, label: 'Communication log', icon: <ForumIcon fontSize="small" /> },
  { to: PATHS.links, label: 'Important links', icon: <LinkIcon fontSize="small" /> },
] as const;
