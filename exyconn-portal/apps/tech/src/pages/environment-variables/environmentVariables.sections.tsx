import type { ReactNode } from 'react';
import type { PageSideNavItem } from '@exyconn/shell/components/navigation/PageSideNav';
import ChatIcon from '@mui/icons-material/Chat';
import ImageIcon from '@mui/icons-material/Image';
import EmailIcon from '@mui/icons-material/Email';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import GitHubIcon from '@mui/icons-material/GitHub';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import DnsIcon from '@mui/icons-material/Dns';
import CloudIcon from '@mui/icons-material/Cloud';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentsIcon from '@mui/icons-material/Payments';
import GoogleIcon from '@mui/icons-material/Google';
import MailIcon from '@mui/icons-material/Mail';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PublicIcon from '@mui/icons-material/Public';
import MapIcon from '@mui/icons-material/Map';
import WebIcon from '@mui/icons-material/Web';
import InsightsIcon from '@mui/icons-material/Insights';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import HistoryIcon from '@mui/icons-material/History';
import { IntegrationProvider } from '@exyconn/shell/graphql/generated';
import { BillingKeysPanel } from './BillingKeysPanel';
import { VaultHistoryPanel } from './vault/VaultHistoryPanel';
import { UsageHistoryPanel } from './usage/UsageHistoryPanel';
import { USAGE_HISTORY_SLUG } from './usage/usage.providers';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import { IntegrationsDashboard } from './usage/IntegrationsDashboard';
import { IntegrationUsageCard } from './usage/IntegrationUsageCard';
import { SlackConfigsPanel } from './SlackConfigsPanel';
import { GoogleMapsConfigsPanel } from './GoogleMapsConfigsPanel';
import { ImageConfigsPanel } from './ImageConfigsPanel';
import { EmailConfigsPanel } from './EmailConfigsPanel';
import { InboundMailConfigsPanel } from './InboundMailConfigsPanel';
import { GithubConfigsPanel } from './GithubConfigsPanel';
import { PexelsConfigsPanel } from './PexelsConfigsPanel';
import { OpenAiConfigsPanel } from './OpenAiConfigsPanel';
import { AiPricingPanel } from './AiPricingPanel';
import { FirecrawlConfigsPanel } from './FirecrawlConfigsPanel';
import { GodaddyConfigsPanel } from './GodaddyConfigsPanel';
import { CloudflareConfigsPanel } from './CloudflareConfigsPanel';
import { StripeConfigsPanel } from './StripeConfigsPanel';
import { RazorpayConfigsPanel } from './RazorpayConfigsPanel';
import { PaypalConfigsPanel } from './PaypalConfigsPanel';
import { PayoneerConfigsPanel } from './PayoneerConfigsPanel';
import { GoogleSignInPanel } from './GoogleSignInPanel';
import { EmailAccountsPanel } from './EmailAccountsPanel';
import { SonarConfigsPanel } from './SonarConfigsPanel';
import { EmailVerifierConfigsPanel } from './EmailVerifierConfigsPanel';

/** One integration: its menu entry and the panel it opens. */
export interface EnvironmentVariablesSection extends PageSideNavItem {
  panel: ReactNode;
}

/** An integration's page: its usage and billing over the period, then its configs. */
function withUsage(provider: IntegrationProvider, panel: ReactNode): ReactNode {
  return (
    <>
      <IntegrationUsageCard provider={provider} />
      {panel}
    </>
  );
}

/** Category names (English sources), in the order the menu groups them. */
const OVERVIEW = 'Overview';
const MESSAGING = 'Messaging & email';
const GOOGLE = 'Google';
const MEDIA = 'Media';
const AI = 'AI';
const PAYMENTS = 'Payments';
const DNS = 'Domains & DNS';
const DEVELOPER = 'Developer tools';

/** Every integration, grouped by category; the first one opens when the address names none. */
export const ENVIRONMENT_VARIABLES_SECTIONS: readonly EnvironmentVariablesSection[] = [
  {
    slug: 'dashboard',
    label: 'Dashboard',
    category: OVERVIEW,
    icon: <InsightsIcon />,
    panel: <IntegrationsDashboard />,
  },
  {
    slug: 'billing-keys',
    label: 'Billing keys',
    category: OVERVIEW,
    icon: <ReceiptLongIcon />,
    panel: <BillingKeysPanel />,
  },
  {
    slug: USAGE_HISTORY_SLUG,
    label: 'Usage history',
    category: OVERVIEW,
    icon: <ManageSearchIcon />,
    panel: <UsageHistoryPanel />,
  },
  {
    slug: 'access-history',
    label: 'Access history',
    category: OVERVIEW,
    icon: <HistoryIcon />,
    panel: <VaultHistoryPanel />,
  },
  {
    slug: 'slack',
    label: 'Slack',
    category: MESSAGING,
    icon: <ChatIcon />,
    panel: withUsage(IntegrationProvider.Slack, <SlackConfigsPanel />),
  },
  {
    slug: 'smtp',
    label: 'SMTP',
    category: MESSAGING,
    icon: <EmailIcon />,
    panel: withUsage(IntegrationProvider.Smtp, <EmailConfigsPanel />),
  },
  {
    slug: 'inbound-mail',
    label: 'Inbound Mail',
    category: MESSAGING,
    icon: <MoveToInboxIcon />,
    panel: <InboundMailConfigsPanel />,
  },
  {
    slug: 'email-verifier',
    label: 'Email verifier',
    category: MESSAGING,
    icon: <MarkEmailReadIcon />,
    panel: <EmailVerifierConfigsPanel />,
  },
  {
    // The Google and Microsoft OAuth apps CRM mailboxes connect through (was Gmail + Microsoft Mail).
    slug: 'email-accounts',
    label: 'Email accounts (OAuth)',
    category: MESSAGING,
    icon: <MailIcon />,
    panel: <EmailAccountsPanel />,
  },
  {
    slug: 'google-sign-in',
    label: 'Google sign-in',
    category: GOOGLE,
    icon: <GoogleIcon />,
    panel: <GoogleSignInPanel />,
  },
  {
    slug: 'google-maps',
    label: 'Google Maps',
    category: GOOGLE,
    icon: <MapIcon />,
    panel: withUsage(IntegrationProvider.GoogleMaps, <GoogleMapsConfigsPanel />),
  },
  {
    slug: 'imagekit',
    label: 'ImageKit',
    category: MEDIA,
    icon: <ImageIcon />,
    panel: withUsage(IntegrationProvider.Imagekit, <ImageConfigsPanel />),
  },
  {
    slug: 'pexels',
    label: 'Pexels',
    category: MEDIA,
    icon: <PhotoLibraryIcon />,
    panel: withUsage(IntegrationProvider.Pexels, <PexelsConfigsPanel />),
  },
  {
    slug: 'openai',
    label: 'OpenAI',
    category: AI,
    icon: <SmartToyIcon />,
    panel: withUsage(IntegrationProvider.Openai, <OpenAiConfigsPanel />),
  },
  {
    slug: 'ai-pricing',
    label: 'AI Pricing',
    category: AI,
    icon: <PriceChangeIcon />,
    panel: <AiPricingPanel />,
  },
  {
    slug: 'firecrawl',
    label: 'Firecrawl',
    category: AI,
    icon: <WebIcon />,
    panel: withUsage(IntegrationProvider.Firecrawl, <FirecrawlConfigsPanel />),
  },
  {
    slug: 'stripe',
    label: 'Stripe',
    category: PAYMENTS,
    icon: <CreditCardIcon />,
    panel: <StripeConfigsPanel />,
  },
  {
    slug: 'razorpay',
    label: 'Razorpay',
    category: PAYMENTS,
    icon: <PaymentsIcon />,
    panel: <RazorpayConfigsPanel />,
  },
  {
    slug: 'paypal',
    label: 'PayPal',
    category: PAYMENTS,
    icon: <AccountBalanceWalletIcon />,
    panel: <PaypalConfigsPanel />,
  },
  {
    slug: 'payoneer',
    label: 'Payoneer',
    category: PAYMENTS,
    icon: <PublicIcon />,
    panel: <PayoneerConfigsPanel />,
  },
  {
    slug: 'godaddy',
    label: 'GoDaddy',
    category: DNS,
    icon: <DnsIcon />,
    panel: <GodaddyConfigsPanel />,
  },
  {
    slug: 'cloudflare',
    label: 'Cloudflare',
    category: DNS,
    icon: <CloudIcon />,
    panel: <CloudflareConfigsPanel />,
  },
  {
    slug: 'github',
    label: 'GitHub',
    category: DEVELOPER,
    icon: <GitHubIcon />,
    panel: withUsage(IntegrationProvider.Github, <GithubConfigsPanel />),
  },
  {
    slug: 'sonarqube',
    label: 'SonarQube',
    category: DEVELOPER,
    icon: <FactCheckIcon />,
    panel: <SonarConfigsPanel />,
  },
];
