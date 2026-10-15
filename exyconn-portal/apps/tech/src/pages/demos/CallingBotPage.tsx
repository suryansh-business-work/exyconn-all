import type { ReactNode } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { Box } from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { CallingBotConfigsPanel } from './CallingBotConfigsPanel';
import { CallingBotCallsPanel } from './CallingBotCallsPanel';
import { CallingBotScenariosPanel } from './CallingBotScenariosPanel';

/** Route the tabs live under; each tab is a slug beneath it. */
export const CALLING_BOT_PATH = '/tech/demos/calling-bot';

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

/** Tech > Demos > Calling bot: its settings, the example calls it plays, and its calls. */
export function CallingBotPage() {
  return <Tabber basePath={CALLING_BOT_PATH} items={TABS} ariaLabel="Calling bot" />;
}
