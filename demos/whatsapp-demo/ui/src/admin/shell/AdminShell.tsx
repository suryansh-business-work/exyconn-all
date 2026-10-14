import { useMemo } from 'react';
import { Route, Routes } from 'react-router-dom';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { Box } from '@exyconn/shell/components/ui';
import type { AuthUser } from '@exyconn/shell/auth/AuthContext';
import { PageErrorBoundary } from '@exyconn/shell/logging/PageErrorBoundary';
import { PAGE_GUTTER } from '@exyconn/shell/layout/PortalLayout/metrics';
import { AnalyticsTab } from '../analytics';
import { SessionsTab } from '../sessions';
import { WorkflowEditorPage, WorkflowListPage } from '../workflows';
import { ChannelTab } from '../channel';
import { ADMIN_BASE, ADMIN_TAB } from '../admin.paths';
import { AdminTopBar } from './AdminTopBar';

/**
 * Bot workflows has two screens: the list at /admin/bot-workflows and one workflow's editor
 * at /admin/bot-workflows/:workflowId. Both paths resolve to the same tab (the tab strip only
 * reads the segment after /admin), and these routes pick the screen inside it.
 */
function BotWorkflowsTab() {
  return (
    <Routes>
      <Route path={ADMIN_TAB.botWorkflows} element={<WorkflowListPage />} />
      <Route path={`${ADMIN_TAB.botWorkflows}/:workflowId`} element={<WorkflowEditorPage />} />
    </Routes>
  );
}

/**
 * The admin area for someone allowed in: a portal-style top bar, then the tabs, each in its
 * own error boundary so one failing screen leaves the others usable. `/admin` lands on
 * Analytics (the tab strip rewrites the URL to the first tab).
 */
export function AdminShell({ user }: Readonly<{ user: AuthUser }>) {
  const tabs = useMemo<TabberItem[]>(
    () => [
      {
        slug: ADMIN_TAB.analytics,
        label: 'Analytics',
        icon: <InsightsOutlinedIcon />,
        content: (
          <PageErrorBoundary>
            <AnalyticsTab />
          </PageErrorBoundary>
        ),
      },
      {
        slug: ADMIN_TAB.sessions,
        label: 'Sessions',
        icon: <HistoryOutlinedIcon />,
        content: (
          <PageErrorBoundary>
            <SessionsTab />
          </PageErrorBoundary>
        ),
      },
      {
        slug: ADMIN_TAB.botWorkflows,
        label: 'Bot workflows',
        icon: <AccountTreeOutlinedIcon />,
        content: (
          <PageErrorBoundary>
            <BotWorkflowsTab />
          </PageErrorBoundary>
        ),
      },
      {
        slug: ADMIN_TAB.whatsappNumber,
        label: 'WhatsApp number',
        icon: <PhoneIphoneOutlinedIcon />,
        content: (
          <PageErrorBoundary>
            <ChannelTab />
          </PageErrorBoundary>
        ),
      },
    ],
    [],
  );

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <AdminTopBar user={user} />
      <Box component="main" sx={{ px: PAGE_GUTTER, pb: 4, minWidth: 0 }}>
        <Tabber
          basePath={ADMIN_BASE}
          items={tabs}
          ariaLabel="WhatsApp demo admin sections"
          sx={{ mb: 3 }}
        />
      </Box>
    </Box>
  );
}
