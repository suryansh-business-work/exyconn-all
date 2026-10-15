import type { ReactNode } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import { Box } from '@exyconn/shell/components/ui';
import { PageErrorBoundary } from '@exyconn/shell/logging/PageErrorBoundary';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { CallingBotConfigsPanel } from './CallingBotConfigsPanel';
import { CallingBotCallsPanel } from './CallingBotCallsPanel';
import { CallingBotScenariosPanel } from './CallingBotScenariosPanel';

import { CALLING_BOT_PATH } from './callingBot.paths';
import { CallFlowsPanel } from './call-flows/CallFlowsPanel';

export { CALLING_BOT_PATH } from './callingBot.paths';

function GlassPanel({ children }: Readonly<{ children: ReactNode }>) {
  return <Box sx={readingPanel}>{children}</Box>;
}

const TABS: TabberItem[] = [
  {
    slug: 'settings',
    label: 'Settings',
    icon: <SettingsIcon />,
    content: (
      <GlassPanel>
        <CallingBotConfigsPanel />
      </GlassPanel>
    ),
  },
  {
    slug: 'examples',
    label: 'Examples',
    icon: <ListAltIcon />,
    content: (
      <GlassPanel>
        <CallingBotScenariosPanel />
      </GlassPanel>
    ),
  },
  {
    slug: 'call-flows',
    label: 'Call flows',
    icon: <AccountTreeOutlinedIcon />,
    content: (
      <PageErrorBoundary>
        <CallFlowsPanel />
      </PageErrorBoundary>
    ),
  },
  {
    slug: 'calls',
    label: 'Calls',
    icon: <HistoryIcon />,
    content: (
      <GlassPanel>
        <CallingBotCallsPanel />
      </GlassPanel>
    ),
  },
];

/** Tech > Demos > Calling bot: its settings, the example calls it plays, their call flows and its calls. */
export function CallingBotPage() {
  return <Tabber basePath={CALLING_BOT_PATH} items={TABS} ariaLabel="Calling bot" />;
}
