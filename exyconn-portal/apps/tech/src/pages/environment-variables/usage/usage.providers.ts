import { IntegrationProvider } from '@exyconn/shell/graphql/generated';

/** The Environment Variables section listing every call. */
export const USAGE_HISTORY_SLUG = 'usage-history';

/** Each counted integration: its name and the Environment Variables section it is set up in. */
export const USAGE_PROVIDERS: Readonly<
  Record<IntegrationProvider, { label: string; slug: string }>
> = {
  [IntegrationProvider.Openai]: { label: 'OpenAI', slug: 'openai' },
  [IntegrationProvider.Smtp]: { label: 'SMTP', slug: 'smtp' },
  [IntegrationProvider.Imagekit]: { label: 'ImageKit', slug: 'imagekit' },
  [IntegrationProvider.Slack]: { label: 'Slack', slug: 'slack' },
  [IntegrationProvider.Github]: { label: 'GitHub', slug: 'github' },
  [IntegrationProvider.Pexels]: { label: 'Pexels', slug: 'pexels' },
  [IntegrationProvider.Firecrawl]: { label: 'Firecrawl', slug: 'firecrawl' },
  [IntegrationProvider.GoogleMaps]: { label: 'Google Maps', slug: 'google-maps' },
  [IntegrationProvider.Stripe]: { label: 'Stripe', slug: 'stripe' },
  [IntegrationProvider.Razorpay]: { label: 'Razorpay', slug: 'razorpay' },
  [IntegrationProvider.Paypal]: { label: 'PayPal', slug: 'paypal' },
  [IntegrationProvider.Payoneer]: { label: 'Payoneer', slug: 'payoneer' },
  [IntegrationProvider.Godaddy]: { label: 'GoDaddy', slug: 'godaddy' },
  [IntegrationProvider.Cloudflare]: { label: 'Cloudflare', slug: 'cloudflare' },
  [IntegrationProvider.Sonarqube]: { label: 'SonarQube', slug: 'sonarqube' },
  [IntegrationProvider.Gmail]: { label: 'Gmail', slug: 'email-accounts' },
  [IntegrationProvider.Microsoft]: { label: 'Microsoft mail', slug: 'email-accounts' },
  [IntegrationProvider.GoogleSignIn]: { label: 'Google sign-in', slug: 'google-sign-in' },
  [IntegrationProvider.EmailVerifier]: { label: 'Email verifier', slug: 'email-verifier' },
  // Set up outside Environment Variables (CRM calling and SMS, the calling bot, social apps,
  // meeting assistant): their page here is the call history.
  [IntegrationProvider.Twilio]: { label: 'Twilio', slug: USAGE_HISTORY_SLUG },
  [IntegrationProvider.Msg91]: { label: 'MSG91', slug: USAGE_HISTORY_SLUG },
  [IntegrationProvider.Vobiz]: { label: 'Vobiz', slug: USAGE_HISTORY_SLUG },
  [IntegrationProvider.Sarvam]: { label: 'Sarvam AI', slug: USAGE_HISTORY_SLUG },
  [IntegrationProvider.Social]: { label: 'Social networks', slug: USAGE_HISTORY_SLUG },
  [IntegrationProvider.Clutch]: { label: 'Clutch (MCP)', slug: USAGE_HISTORY_SLUG },
  [IntegrationProvider.Apify]: { label: 'Apify', slug: USAGE_HISTORY_SLUG },
  [IntegrationProvider.GoogleCalendar]: {
    label: 'Google Calendar and Meet',
    slug: USAGE_HISTORY_SLUG,
  },
};

/** The windows a dashboard offers, in days. */
export const USAGE_WINDOWS = [7, 30, 90, 180] as const;
export const DEFAULT_USAGE_DAYS = 30;

/** Every cost is recorded in US dollars; it is the currency shown until another is picked. */
export const BASE_CURRENCY = 'USD';
