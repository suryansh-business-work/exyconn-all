import type { ReactNode } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import ChatIcon from '@mui/icons-material/Chat';
import ImageIcon from '@mui/icons-material/Image';
import EmailIcon from '@mui/icons-material/Email';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import GitHubIcon from '@mui/icons-material/GitHub';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import { glass } from '@exyconn/shell/components/glass/glass';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { SlackConfigsPanel } from './SlackConfigsPanel';
import { ImageConfigsPanel } from './ImageConfigsPanel';
import { EmailConfigsPanel } from './EmailConfigsPanel';
import { InboundMailConfigsPanel } from './InboundMailConfigsPanel';
import { GithubConfigsPanel } from './GithubConfigsPanel';
import { PexelsConfigsPanel } from './PexelsConfigsPanel';
import { OpenAiConfigsPanel } from './OpenAiConfigsPanel';
import { AiPricingPanel } from './AiPricingPanel';

/** Route the tabs live under; each tab is a slug beneath it. */
export const ENVIRONMENT_VARIABLES_PATH = '/tech/environment-variables';

/** The card every tab's panel sits in, so the tab strip stays above the card. */
function GlassPanel({ children }: Readonly<{ children: ReactNode }>) {
  return <Box sx={[glass, { p: { xs: 2, md: 3 } }]}>{children}</Box>;
}

/** One tab per integration, in the order they appear on the Environment Variables screen. */
const TABS: TabberItem[] = [
  {
    slug: 'slack',
    label: 'Slack',
    icon: <ChatIcon />,
    content: (
      <GlassPanel>
        <SlackConfigsPanel />
      </GlassPanel>
    ),
  },
  {
    slug: 'imagekit',
    label: 'ImageKit',
    icon: <ImageIcon />,
    content: (
      <GlassPanel>
        <ImageConfigsPanel />
      </GlassPanel>
    ),
  },
  {
    slug: 'pexels',
    label: 'Pexels',
    icon: <PhotoLibraryIcon />,
    content: (
      <GlassPanel>
        <PexelsConfigsPanel />
      </GlassPanel>
    ),
  },
  {
    slug: 'openai',
    label: 'OpenAI',
    icon: <SmartToyIcon />,
    content: (
      <GlassPanel>
        <OpenAiConfigsPanel />
      </GlassPanel>
    ),
  },
  {
    slug: 'ai-pricing',
    label: 'AI Pricing',
    icon: <PriceChangeIcon />,
    content: (
      <GlassPanel>
        <AiPricingPanel />
      </GlassPanel>
    ),
  },
  {
    slug: 'smtp',
    label: 'SMTP',
    icon: <EmailIcon />,
    content: (
      <GlassPanel>
        <EmailConfigsPanel />
      </GlassPanel>
    ),
  },
  {
    slug: 'inbound-mail',
    label: 'Inbound Mail',
    icon: <MoveToInboxIcon />,
    content: (
      <GlassPanel>
        <InboundMailConfigsPanel />
      </GlassPanel>
    ),
  },
  {
    slug: 'github',
    label: 'GitHub',
    icon: <GitHubIcon />,
    content: (
      <GlassPanel>
        <GithubConfigsPanel />
      </GlassPanel>
    ),
  },
];

/**
 * Environment Variables — the integration credentials the whole platform runs on,
 * stored in the database rather than in a .env file so they can be rotated and
 * verified here without a redeploy. Which tab is open lives in the URL.
 */
export function EnvironmentVariablesPage() {
  return (
    <Box>
      <Tabber
        basePath={ENVIRONMENT_VARIABLES_PATH}
        items={TABS}
        ariaLabel="Integration credentials"
        sx={{ mb: 2 }}
      />
    </Box>
  );
}
