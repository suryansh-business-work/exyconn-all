import type { ProviderGuide } from './provider-guide.types';

/** Maps, media and AI. */
export const SERVICE_GUIDES: readonly ProviderGuide[] = [
  {
    provider: 'google-maps',
    label: 'Google Maps',
    billing: {
      need: 'REQUIRED',
      message:
        'A separate credential is required to read billing. Maps API keys cannot read spend; Google Cloud Billing is read with a service account that has the Billing Account Viewer role (or from the billing export to BigQuery). Until one is added, see the cost in Cloud Billing → Reports.',
    },
    steps: [
      {
        description:
          'Open console.cloud.google.com, pick the project and link a billing account (Maps will not answer without one).',
      },
      {
        description:
          'Under APIs & Services → Library, enable the Maps JavaScript API and the Places API.',
      },
      {
        description:
          'Under Credentials → Create credentials → API key, create the browser key and restrict it to your portal addresses (HTTP referrers) and the Maps JavaScript API.',
      },
      {
        description:
          'Create a second key for the server, restricted to the server’s IP address and the Places API.',
      },
      { description: 'Paste them into Browser key and Server key here.' },
    ],
    links: [
      {
        kind: 'API_KEYS',
        label: 'Google Cloud credentials',
        url: 'https://console.cloud.google.com/apis/credentials',
      },
      {
        kind: 'USAGE',
        label: 'Maps usage and quotas',
        url: 'https://console.cloud.google.com/google/maps-apis/quotas',
      },
      {
        kind: 'BILLING',
        label: 'Cloud Billing reports',
        url: 'https://console.cloud.google.com/billing',
      },
    ],
  },
  {
    provider: 'imagekit',
    label: 'ImageKit',
    billing: {
      need: 'SAME_KEY',
      message:
        'A separate billing API key is not required. ImageKit’s usage API (bandwidth, storage, transformations) is read with the current private key.',
    },
    steps: [
      { description: 'Sign in at imagekit.io and open Developer options → API keys.' },
      {
        description:
          'Copy the Public key, the Private key and the URL endpoint (https://ik.imagekit.io/<your id>).',
      },
      { description: 'Paste them here and use Test upload to check them.' },
    ],
    links: [
      {
        kind: 'API_KEYS',
        label: 'ImageKit API keys',
        url: 'https://imagekit.io/dashboard/developer/api-keys',
      },
      { kind: 'USAGE', label: 'ImageKit usage', url: 'https://imagekit.io/dashboard/usage' },
      { kind: 'BILLING', label: 'ImageKit billing', url: 'https://imagekit.io/dashboard/billing' },
    ],
  },
  {
    provider: 'pexels',
    label: 'Pexels',
    billing: {
      need: 'NO_BILLING_API',
      message:
        'A separate billing API key is not required. The Pexels API is free; it only limits requests per hour, which the current key reports.',
    },
    steps: [
      { description: 'Sign in at pexels.com and open pexels.com/api.' },
      { description: 'Fill in the short form describing the use and accept the terms.' },
      { description: 'Copy “Your API key” into API key here.' },
    ],
    links: [
      { kind: 'API_KEYS', label: 'Pexels API key', url: 'https://www.pexels.com/api/new/' },
      {
        kind: 'DOCS',
        label: 'Pexels API documentation',
        url: 'https://www.pexels.com/api/documentation/',
      },
    ],
  },
  {
    provider: 'openai',
    label: 'OpenAI',
    billing: {
      need: 'REQUIRED',
      message:
        'A separate billing key is required. OpenAI’s Usage and Costs APIs only accept an Admin API key (sk-admin-…), which an organisation owner creates. Add it under Billing keys; the normal API key keeps making the AI calls.',
    },
    steps: [
      { description: 'Sign in at platform.openai.com with an account in the organisation.' },
      {
        description:
          'Open API keys → Create new secret key, choose the project and give it a name.',
      },
      { description: 'Copy the key at once (it is shown only once) into API key here.' },
      {
        description:
          'For real costs, an organisation owner opens Settings → Organization → Admin keys, creates an Admin key and adds it under Billing keys.',
      },
    ],
    links: [
      { kind: 'API_KEYS', label: 'OpenAI API keys', url: 'https://platform.openai.com/api-keys' },
      {
        kind: 'API_KEYS',
        label: 'OpenAI Admin keys',
        url: 'https://platform.openai.com/settings/organization/admin-keys',
      },
      { kind: 'USAGE', label: 'OpenAI usage', url: 'https://platform.openai.com/usage' },
      {
        kind: 'BILLING',
        label: 'OpenAI billing',
        url: 'https://platform.openai.com/settings/organization/billing/overview',
      },
    ],
  },
  {
    provider: 'firecrawl',
    label: 'Firecrawl',
    billing: {
      need: 'SAME_KEY',
      message:
        'A separate billing API key is not required. Firecrawl’s credit usage endpoint answers with the current API key.',
    },
    steps: [
      { description: 'Sign in at firecrawl.dev and open the dashboard.' },
      { description: 'Open API Keys and create a key (it starts with fc-).' },
      { description: 'Paste it here.' },
    ],
    links: [
      {
        kind: 'API_KEYS',
        label: 'Firecrawl API keys',
        url: 'https://www.firecrawl.dev/app/api-keys',
      },
      { kind: 'USAGE', label: 'Firecrawl usage', url: 'https://www.firecrawl.dev/app/usage' },
      { kind: 'DOCS', label: 'Firecrawl documentation', url: 'https://docs.firecrawl.dev' },
    ],
  },
];
