import type { ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
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
import { DemosForbidden } from '../website-bot/DemosForbidden';
import { WHATSAPP_AGENT_PATH, WHATSAPP_AGENT_TAB } from './whatsappAgent.paths';
import { WhatsappNumberTab } from './WhatsappNumberTab';

/**
 * The shared bot studio, run for the WhatsApp channel. Its preview is the plain chat widget: the
 * full WhatsApp look-alike lives in the demo (demos/whatsapp-demo/ui) and is linked from the
 * WhatsApp number tab rather than copied here.
 */
const STUDIO: StudioConfig = {
  channel: 'whatsapp',
  name: 'WhatsApp agent',
  workflowsPath: `${WHATSAPP_AGENT_PATH}/${WHATSAPP_AGENT_TAB.workflows}`,
  renderPreview: (bundle, startWorkflow) => (
    <WidgetPreview bundle={bundle} startWorkflow={startWorkflow} />
  ),
  forbidden: <DemosForbidden />,
};

/** The workflow list, and one workflow's React Flow editor under it. */
function WorkflowsTab() {
  return (
    <Routes>
      <Route path={WHATSAPP_AGENT_TAB.workflows} element={<WorkflowListPage />} />
      <Route
        path={`${WHATSAPP_AGENT_TAB.workflows}/:workflowId`}
        element={<WorkflowEditorPage />}
      />
    </Routes>
  );
}

const guarded = (content: ReactElement) => <PageErrorBoundary>{content}</PageErrorBoundary>;

const TABS: TabberItem[] = [
  {
    slug: WHATSAPP_AGENT_TAB.workflows,
    label: 'Bot workflows',
    icon: <AccountTreeOutlinedIcon />,
    content: guarded(<WorkflowsTab />),
  },
  {
    slug: WHATSAPP_AGENT_TAB.analytics,
    label: 'Analytics',
    icon: <InsightsOutlinedIcon />,
    content: guarded(<AnalyticsTab />),
  },
  {
    slug: WHATSAPP_AGENT_TAB.sessions,
    label: 'Sessions',
    icon: <HistoryOutlinedIcon />,
    content: guarded(<SessionsTab />),
  },
  {
    slug: WHATSAPP_AGENT_TAB.number,
    label: 'WhatsApp number',
    icon: <PhoneIphoneOutlinedIcon />,
    content: guarded(<WhatsappNumberTab />),
  },
];

/**
 * Agents > WhatsApp: the WhatsApp agent's workflows in the React Flow designer, how people use
 * them, its sessions and the real number it answers on.
 */
export function WhatsappAgentPage() {
  return (
    <StudioProvider config={STUDIO}>
      <PageHeader
        title="WhatsApp agent"
        subtitle="The workflows behind demos.exyconn.com/whatsapp-demo and a connected WhatsApp number"
      />
      <Tabber basePath={WHATSAPP_AGENT_PATH} items={TABS} ariaLabel="WhatsApp agent" />
    </StudioProvider>
  );
}
