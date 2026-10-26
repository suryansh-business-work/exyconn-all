import type { ProviderGuide } from './provider-guide.types';

/** Slack, mail and the OAuth apps CRM mailboxes connect through. */
export const MESSAGING_GUIDES: readonly ProviderGuide[] = [
  {
    provider: 'slack',
    label: 'Slack',
    billing: {
      need: 'NO_BILLING_API',
      message:
        'A separate billing API key is not required. Slack has no billing API for apps; the workspace plan and invoices are in the workspace’s Billing settings, and the current bot token is enough for everything this portal does.',
    },
    steps: [
      {
        description:
          'Open api.slack.com/apps and choose Create New App → From scratch, then pick the workspace.',
      },
      {
        description:
          'Under OAuth & Permissions, add the bot token scopes the portal needs (chat:write, chat:write.public, channels:read).',
      },
      { description: 'Choose Install to Workspace and approve it.' },
      { description: 'Copy the Bot User OAuth Token (it starts with xoxb-) into Bot token.' },
      {
        description:
          'Under Basic Information → App Credentials, copy the Signing Secret into Signing secret.',
      },
    ],
    links: [
      { kind: 'DASHBOARD', label: 'Your Slack apps', url: 'https://api.slack.com/apps' },
      { kind: 'BILLING', label: 'Workspace billing', url: 'https://slack.com/account/billing' },
      { kind: 'DOCS', label: 'Slack API documentation', url: 'https://api.slack.com/docs' },
    ],
  },
  {
    provider: 'smtp',
    label: 'SMTP',
    billing: {
      need: 'NO_BILLING_API',
      message:
        'A separate billing API key is not required. SMTP has no billing interface; sending limits and charges are in your mail provider’s console (Google Workspace, Microsoft 365, Amazon SES, etc.), and the current SMTP login is all the portal uses.',
    },
    steps: [
      {
        description:
          'Google Workspace or Gmail: turn on 2-Step Verification for the sending account.',
      },
      {
        description:
          'Open myaccount.google.com/apppasswords, create an app password named “Exyconn portal” and copy the 16 characters into Password.',
      },
      {
        description:
          'Use host smtp.gmail.com, port 465 with SSL (or 587 with STARTTLS), and the full address as Username.',
      },
      {
        description:
          'Other providers: create an SMTP credential in their console (for Amazon SES: SMTP settings → Create SMTP credentials) and use the host and port they show.',
      },
      { description: 'Save, then use Send test email to confirm delivery.' },
    ],
    links: [
      {
        kind: 'API_KEYS',
        label: 'Google app passwords',
        url: 'https://myaccount.google.com/apppasswords',
      },
      {
        kind: 'BILLING',
        label: 'Google Workspace billing',
        url: 'https://admin.google.com/ac/billing/subscriptions',
      },
      {
        kind: 'DOCS',
        label: 'Gmail SMTP settings',
        url: 'https://support.google.com/a/answer/176600',
      },
    ],
  },
  {
    provider: 'inbound-mail',
    label: 'Inbound Mail',
    billing: {
      need: 'NO_BILLING_API',
      message:
        'A separate billing API key is not required. IMAP mailboxes are billed with the mail plan they belong to; the current mailbox login is enough.',
    },
    steps: [
      {
        description:
          'Make sure IMAP is enabled for the mailbox (Gmail: Settings → Forwarding and POP/IMAP → Enable IMAP).',
      },
      {
        description:
          'Create an app password for the mailbox (Google: myaccount.google.com/apppasswords; Microsoft 365: an app password or OAuth, as your admin allows).',
      },
      {
        description:
          'Use the IMAP host and port your provider gives (Gmail: imap.gmail.com, 993, SSL).',
      },
      { description: 'Save and check that new support emails arrive as tickets.' },
    ],
    links: [
      {
        kind: 'API_KEYS',
        label: 'Google app passwords',
        url: 'https://myaccount.google.com/apppasswords',
      },
      {
        kind: 'DOCS',
        label: 'Gmail IMAP settings',
        url: 'https://support.google.com/mail/answer/7126229',
      },
    ],
  },
  {
    provider: 'email-verifier',
    label: 'Email verifier',
    billing: {
      need: 'NO_BILLING_API',
      message:
        'A separate billing API key is not required. The verifier checks mailboxes itself; the only paid part is the optional proxy, billed in that proxy provider’s own dashboard.',
    },
    steps: [
      {
        description:
          'If you verify at volume, buy a residential or SOCKS proxy that allows outbound port 25.',
      },
      {
        description:
          'Copy the proxy host, port, username and password from the proxy provider’s dashboard.',
      },
      { description: 'Enter them here and run a test verification on an address you own.' },
    ],
    links: [],
  },
  {
    provider: 'email-accounts',
    label: 'Email accounts (Google and Microsoft apps)',
    billing: {
      need: 'NO_BILLING_API',
      message:
        'A separate billing API key is not required. Google and Microsoft OAuth apps are free; the Gmail and Microsoft Graph mail APIs have no charges for this use.',
    },
    steps: [
      { description: 'Google: in console.cloud.google.com, enable the Gmail API for the project.' },
      {
        description:
          'Google: under APIs & Services → OAuth consent screen, set the app up and add the Gmail scopes.',
      },
      {
        description:
          'Google: under Credentials → Create credentials → OAuth client ID → Web application, add the redirect URI shown on this page, then copy the client ID and secret.',
      },
      {
        description:
          'Microsoft: in entra.microsoft.com → App registrations → New registration, add the redirect URI shown on this page.',
      },
      {
        description:
          'Microsoft: under Certificates & secrets → New client secret, copy the value at once (it is shown only once), and add the Mail.Send, Mail.Read and offline_access delegated permissions.',
      },
    ],
    links: [
      {
        kind: 'API_KEYS',
        label: 'Google Cloud credentials',
        url: 'https://console.cloud.google.com/apis/credentials',
      },
      {
        kind: 'API_KEYS',
        label: 'Microsoft Entra app registrations',
        url: 'https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
      },
      {
        kind: 'DOCS',
        label: 'Gmail API documentation',
        url: 'https://developers.google.com/gmail/api',
      },
    ],
  },
  {
    provider: 'google-sign-in',
    label: 'Google sign-in',
    billing: {
      need: 'NO_BILLING_API',
      message:
        'A separate billing API key is not required. “Sign in with Google” is free; there is nothing to bill.',
    },
    steps: [
      { description: 'Open console.cloud.google.com and choose (or create) the project.' },
      {
        description:
          'Under APIs & Services → OAuth consent screen, fill in the app name, support email and authorised domains.',
      },
      {
        description:
          'Under Credentials → Create credentials → OAuth client ID, choose Web application.',
      },
      {
        description:
          'Add the redirect URI shown on this page to Authorised redirect URIs, and each portal address to Authorised JavaScript origins.',
      },
      { description: 'Copy the client ID and client secret here.' },
    ],
    links: [
      {
        kind: 'API_KEYS',
        label: 'Google Cloud credentials',
        url: 'https://console.cloud.google.com/apis/credentials',
      },
      {
        kind: 'DOCS',
        label: 'Google Identity documentation',
        url: 'https://developers.google.com/identity',
      },
    ],
  },
];
