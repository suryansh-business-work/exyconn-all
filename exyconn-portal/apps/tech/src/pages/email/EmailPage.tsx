import type { ReactNode } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import ExtensionIcon from '@mui/icons-material/Extension';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import { glass } from '@exyconn/shell/components/glass/glass';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { EmailDashboardPanel } from './EmailDashboardPanel';
import { EmailTemplatesPanel } from './EmailTemplatesPanel';
import { EmailFragmentsPanel } from './EmailFragmentsPanel';
import { EmailLogsPanel } from './EmailLogsPanel';
import { EmailConfigsPanel } from '../environment-variables/EmailConfigsPanel';

/** Route the tabs live under; each tab is a slug beneath it. */
export const EMAIL_PATH = '/tech/email';

/** The card every tab's panel sits in, so the tab strip stays above the card. */
function GlassPanel({ children }: Readonly<{ children: ReactNode }>) {
  return <Box sx={[glass, { p: { xs: 2, md: 3 } }]}>{children}</Box>;
}

/**
 * Dashboard first: the question anybody opening this screen has is "is email working?", and
 * it is the one question a list of templates cannot answer.
 */
const TABS: TabberItem[] = [
  {
    slug: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    content: (
      <GlassPanel>
        <EmailDashboardPanel />
      </GlassPanel>
    ),
  },
  {
    slug: 'templates',
    label: 'Templates',
    icon: <DescriptionIcon />,
    content: (
      <GlassPanel>
        <EmailTemplatesPanel />
      </GlassPanel>
    ),
  },
  {
    slug: 'fragments',
    label: 'Fragments',
    icon: <ExtensionIcon />,
    content: (
      <GlassPanel>
        <EmailFragmentsPanel />
      </GlassPanel>
    ),
  },
  {
    slug: 'logs',
    label: 'Logs',
    icon: <HistoryIcon />,
    content: (
      <GlassPanel>
        <EmailLogsPanel />
      </GlassPanel>
    ),
  },
  {
    // The same SMTP panel as Environment Variables, deliberately reused rather than copied:
    // there is one set of credentials, and two screens that could disagree about it is worse
    // than one screen you have to go and find.
    slug: 'settings',
    label: 'Settings',
    icon: <SettingsIcon />,
    content: (
      <GlassPanel>
        <EmailConfigsPanel />
      </GlassPanel>
    ),
  },
];

/**
 * Tech → Email: the whole transactional email system — what the emails say, the pieces they
 * share, what has actually been sent, and the credentials it all goes out through.
 */
export function EmailPage() {
  return (
    <Box>
      <Tabber basePath={EMAIL_PATH} items={TABS} ariaLabel="Email system" sx={{ mb: 2 }} />
    </Box>
  );
}
