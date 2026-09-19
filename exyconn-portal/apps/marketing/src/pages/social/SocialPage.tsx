import LinkIcon from '@mui/icons-material/Link';
import ListAltIcon from '@mui/icons-material/ListAlt';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import InsightsIcon from '@mui/icons-material/Insights';
import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { AccountsTab } from './AccountsTab';
import { PostsTab } from './PostsTab';
import { ComposeTab } from './ComposeTab';
import { CalendarTab } from './CalendarTab';
import { AnalyticsTab } from './AnalyticsTab';
import { SOCIAL_PATH } from './social.labels';

/** Accounts first: it is where the provider sends people back after connecting one. */
const TABS: TabberItem[] = [
  { slug: 'accounts', label: 'Accounts', icon: <LinkIcon />, content: <AccountsTab /> },
  { slug: 'posts', label: 'Posts', icon: <ListAltIcon />, content: <PostsTab /> },
  { slug: 'compose', label: 'Compose', icon: <EditNoteIcon />, content: <ComposeTab /> },
  { slug: 'calendar', label: 'Calendar', icon: <CalendarMonthIcon />, content: <CalendarTab /> },
  { slug: 'analytics', label: 'Analytics', icon: <InsightsIcon />, content: <AnalyticsTab /> },
];

/** Marketing › Social media: connect accounts, write and schedule posts, and see what works. */
export function SocialPage() {
  return (
    <Box>
      <PageHeader
        title="Social media"
        subtitle="Connect accounts, plan and publish posts, and see how they do"
      />
      <Tabber basePath={SOCIAL_PATH} items={TABS} ariaLabel="Social media" sx={{ mb: 2 }} />
    </Box>
  );
}
