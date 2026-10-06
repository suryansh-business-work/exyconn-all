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
import DnsIcon from '@mui/icons-material/Dns';
import CloudIcon from '@mui/icons-material/Cloud';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentsIcon from '@mui/icons-material/Payments';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PublicIcon from '@mui/icons-material/Public';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { SlackConfigsPanel } from './SlackConfigsPanel';
import { ImageConfigsPanel } from './ImageConfigsPanel';
import { EmailConfigsPanel } from './EmailConfigsPanel';
import { InboundMailConfigsPanel } from './InboundMailConfigsPanel';
import { GithubConfigsPanel } from './GithubConfigsPanel';
import { PexelsConfigsPanel } from './PexelsConfigsPanel';
import { OpenAiConfigsPanel } from './OpenAiConfigsPanel';
import { AiPricingPanel } from './AiPricingPanel';
import { GodaddyConfigsPanel } from './GodaddyConfigsPanel';
import { CloudflareConfigsPanel } from './CloudflareConfigsPanel';
import { StripeConfigsPanel } from './StripeConfigsPanel';
import { RazorpayConfigsPanel } from './RazorpayConfigsPanel';
import { PaypalConfigsPanel } from './PaypalConfigsPanel';
import { PayoneerConfigsPanel } from './PayoneerConfigsPanel';
import { SonarConfigsPanel } from './SonarConfigsPanel';

/** Route the tabs live under; each tab is a slug beneath it. */
export const ENVIRONMENT_VARIABLES_PATH = '/tech/environment-variables';

/** The card every tab's panel sits in, so the tab strip stays above the card. */
function GlassPanel({ children }: Readonly<{ children: ReactNode }>) {
  return <Box sx={readingPanel}>{children}</Box>;
}

/** A tab whose panel sits in the shared card. */
const panelTab = (
  slug: string,
  label: string,
  icon: TabberItem['icon'],
  panel: ReactNode,
): TabberItem => ({
  slug,
  label,
  icon,
  content: <GlassPanel>{panel}</GlassPanel>,
});

/** One tab per integration, in the order they appear on the Environment Variables screen. */
const TABS: TabberItem[] = [
  panelTab('slack', 'Slack', <ChatIcon />, <SlackConfigsPanel />),
  panelTab('imagekit', 'ImageKit', <ImageIcon />, <ImageConfigsPanel />),
  panelTab('pexels', 'Pexels', <PhotoLibraryIcon />, <PexelsConfigsPanel />),
  panelTab('openai', 'OpenAI', <SmartToyIcon />, <OpenAiConfigsPanel />),
  panelTab('ai-pricing', 'AI Pricing', <PriceChangeIcon />, <AiPricingPanel />),
  panelTab('smtp', 'SMTP', <EmailIcon />, <EmailConfigsPanel />),
  panelTab('inbound-mail', 'Inbound Mail', <MoveToInboxIcon />, <InboundMailConfigsPanel />),
  panelTab('github', 'GitHub', <GitHubIcon />, <GithubConfigsPanel />),
  panelTab('godaddy', 'GoDaddy', <DnsIcon />, <GodaddyConfigsPanel />),
  panelTab('cloudflare', 'Cloudflare', <CloudIcon />, <CloudflareConfigsPanel />),
  panelTab('stripe', 'Stripe', <CreditCardIcon />, <StripeConfigsPanel />),
  panelTab('razorpay', 'Razorpay', <PaymentsIcon />, <RazorpayConfigsPanel />),
  panelTab('paypal', 'PayPal', <AccountBalanceWalletIcon />, <PaypalConfigsPanel />),
  panelTab('payoneer', 'Payoneer', <PublicIcon />, <PayoneerConfigsPanel />),
  panelTab('sonarqube', 'SonarQube', <FactCheckIcon />, <SonarConfigsPanel />),
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
