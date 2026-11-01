import type { ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import IntegrationInstructionsOutlinedIcon from '@mui/icons-material/IntegrationInstructionsOutlined';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { PageErrorBoundary } from '@exyconn/shell/logging/PageErrorBoundary';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import {
  AnalyticsTab,
  SessionsTab,
  StudioProvider,
  WorkflowEditorPage,
  WorkflowListPage,
  type StudioConfig,
} from '@exyconn/bot-studio/studio';
import { WidgetPreview } from '@exyconn/bot-studio/widget';
import { DemosForbidden } from './DemosForbidden';
import { WebsiteBotSetup } from './WebsiteBotSetup';
import { WEBSITE_BOT_PATH, WEBSITE_BOT_TAB } from './websiteBot.paths';

/** The shared bot studio, run for the website channel with the website widget as its preview. */
const STUDIO: StudioConfig = {
  channel: 'website',
  name: 'Website chat agent',
  workflowsPath: `${WEBSITE_BOT_PATH}/${WEBSITE_BOT_TAB.workflows}`,
  renderPreview: (bundle, startWorkflow) => (
    <WidgetPreview bundle={bundle} startWorkflow={startWorkflow} />
  ),
  forbidden: <DemosForbidden />,
};

/** The workflow list, and one workflow's React Flow editor under it. */
function BotWorkflowsTab() {
  return (
    <Routes>
      <Route path={WEBSITE_BOT_TAB.workflows} element={<WorkflowListPage />} />
      <Route path={`${WEBSITE_BOT_TAB.workflows}/:workflowId`} element={<WorkflowEditorPage />} />
    </Routes>
  );
}

const guarded = (content: ReactElement) => <PageErrorBoundary>{content}</PageErrorBoundary>;

const TABS: TabberItem[] = [
  {
    slug: WEBSITE_BOT_TAB.workflows,
    label: 'Bot workflows',
    icon: <AccountTreeOutlinedIcon />,
    content: guarded(<BotWorkflowsTab />),
  },
  {
    slug: WEBSITE_BOT_TAB.analytics,
    label: 'Analytics',
    icon: <InsightsOutlinedIcon />,
    content: guarded(<AnalyticsTab />),
  },
  {
    slug: WEBSITE_BOT_TAB.sessions,
    label: 'Sessions',
    icon: <HistoryOutlinedIcon />,
    content: guarded(<SessionsTab />),
  },
  {
    slug: WEBSITE_BOT_TAB.setup,
    label: 'Setup',
    icon: <IntegrationInstructionsOutlinedIcon />,
    content: guarded(<WebsiteBotSetup />),
  },
];

/**
 * Agents > Website chat agent: the AI website chat agent's admin — its demo websites and
 * their workflows in the React Flow designer (previewed in the website widget), how prospects
 * use the live demo, and how it is set up.
 */
export function WebsiteBotPage() {
  return (
    <StudioProvider config={STUDIO}>
      <PageHeader
        title="Website chat bot"
        subtitle="The AI agent behind demos.exyconn.com/website-chat-demo and on clients' websites"
      />
      <Tabber basePath={WEBSITE_BOT_PATH} items={TABS} ariaLabel="Website chat bot" />
    </StudioProvider>
  );
}
