import type { ProviderGuide } from './provider-guide.types';

/** Domains, DNS and developer tools. */
export const DEVELOPER_GUIDES: readonly ProviderGuide[] = [
  {
    provider: 'godaddy',
    label: 'GoDaddy',
    billing: {
      need: 'NO_BILLING_API',
      message:
        'A separate billing API key is not required. GoDaddy has no billing API; renewals and invoices are under My Products and Renewals & Billing. The current key and secret cover the domain and DNS calls.',
    },
    steps: [
      { description: 'Sign in at developer.godaddy.com and open API Keys.' },
      { description: 'Choose Create New API Key, pick Production (not OTE) and give it a name.' },
      { description: 'Copy the Key and the Secret (the secret is shown once) into this page.' },
    ],
    links: [
      { kind: 'API_KEYS', label: 'GoDaddy API keys', url: 'https://developer.godaddy.com/keys' },
      {
        kind: 'BILLING',
        label: 'GoDaddy renewals and billing',
        url: 'https://account.godaddy.com/billing',
      },
    ],
  },
  {
    provider: 'cloudflare',
    label: 'Cloudflare',
    billing: {
      need: 'PERMISSION',
      message:
        'A separate billing API key is not required. Cloudflare’s billing endpoints answer with the current API token once it also has the Account → Billing: Read permission.',
    },
    steps: [
      { description: 'Sign in at dash.cloudflare.com and open My Profile → API Tokens.' },
      { description: 'Choose Create Token and start from the Edit zone DNS template.' },
      {
        description:
          'Add Zone → Zone: Read, and optionally Account → Billing: Read; limit it to your zones.',
      },
      { description: 'Create the token, copy it at once and paste it here with the account ID.' },
    ],
    links: [
      {
        kind: 'API_KEYS',
        label: 'Cloudflare API tokens',
        url: 'https://dash.cloudflare.com/profile/api-tokens',
      },
      {
        kind: 'BILLING',
        label: 'Cloudflare billing',
        url: 'https://dash.cloudflare.com/?to=/:account/billing',
      },
    ],
  },
  {
    provider: 'github',
    label: 'GitHub',
    billing: {
      need: 'PERMISSION',
      message:
        'A separate billing API key is not required. GitHub’s billing usage endpoints answer with the current token once it is allowed to read the account’s or organisation’s billing (an organisation owner’s token with administration read access).',
    },
    steps: [
      {
        description:
          'Sign in at github.com and open Settings → Developer settings → Personal access tokens → Fine-grained tokens.',
      },
      {
        description:
          'Choose Generate new token, set the owner to the organisation and select the repository.',
      },
      {
        description:
          'Grant Actions (read and write) and Contents (read) so builds can be started and read.',
      },
      {
        description:
          'Generate the token, copy it at once and paste it here with the owner and repository.',
      },
    ],
    links: [
      {
        kind: 'API_KEYS',
        label: 'GitHub fine-grained tokens',
        url: 'https://github.com/settings/personal-access-tokens',
      },
      { kind: 'BILLING', label: 'GitHub billing', url: 'https://github.com/settings/billing' },
      {
        kind: 'USAGE',
        label: 'GitHub Actions usage',
        url: 'https://github.com/settings/billing/usage',
      },
    ],
  },
  {
    provider: 'sonarqube',
    label: 'SonarQube',
    billing: {
      need: 'NO_BILLING_API',
      message:
        'A separate billing API key is not required. This SonarQube is self-hosted; there is no bill to read.',
    },
    steps: [
      { description: 'Sign in to your SonarQube server and open My Account → Security.' },
      {
        description:
          'Generate a token (a Global analysis token, or a user token with Browse on the project).',
      },
      { description: 'Copy it at once and paste it here with the server address and project key.' },
    ],
    links: [
      {
        kind: 'DOCS',
        label: 'SonarQube tokens',
        url: 'https://docs.sonarsource.com/sonarqube-server/latest/user-guide/managing-tokens/',
      },
    ],
  },
];
