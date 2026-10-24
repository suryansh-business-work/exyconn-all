import { IntegrationProvider } from '@exyconn/shell/graphql/generated';

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
};

/** The windows a dashboard offers, in days. */
export const USAGE_WINDOWS = [7, 30, 90, 180] as const;
export const DEFAULT_USAGE_DAYS = 30;

/** Every cost is recorded in US dollars; it is the currency shown until another is picked. */
export const BASE_CURRENCY = 'USD';
