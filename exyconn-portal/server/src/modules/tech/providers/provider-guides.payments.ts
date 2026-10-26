import type { ProviderGuide } from './provider-guide.types';

/** The gateways clients pay through. Fees are read from the same API as payments. */
export const PAYMENT_GUIDES: readonly ProviderGuide[] = [
  {
    provider: 'stripe',
    label: 'Stripe',
    billing: {
      need: 'SAME_KEY',
      message:
        'A separate billing API key is not required. Stripe’s fees are on each balance transaction, read with the current secret key. A restricted key works too if it can read Balance and Charges.',
    },
    steps: [
      { description: 'Sign in at dashboard.stripe.com (switch Test mode off for live keys).' },
      {
        description:
          'Open Developers → API keys and reveal the Secret key, or create a restricted key.',
      },
      {
        description:
          'Open Developers → Webhooks → Add endpoint, paste the webhook URL shown on this page and pick the payment events.',
      },
      { description: 'Reveal the endpoint’s Signing secret (whsec_…) and paste both values here.' },
    ],
    links: [
      { kind: 'API_KEYS', label: 'Stripe API keys', url: 'https://dashboard.stripe.com/apikeys' },
      { kind: 'OTHER', label: 'Stripe webhooks', url: 'https://dashboard.stripe.com/webhooks' },
      {
        kind: 'BILLING',
        label: 'Stripe balance and fees',
        url: 'https://dashboard.stripe.com/balance',
      },
    ],
  },
  {
    provider: 'razorpay',
    label: 'Razorpay',
    billing: {
      need: 'SAME_KEY',
      message:
        'A separate billing API key is not required. Razorpay returns the fee and tax on every payment and settlement with the current key ID and secret.',
    },
    steps: [
      { description: 'Sign in at dashboard.razorpay.com and choose Live or Test mode.' },
      {
        description:
          'Open Account & Settings → API Keys → Generate key, and copy the Key ID and Key Secret (the secret is shown once).',
      },
      {
        description:
          'Open Account & Settings → Webhooks → Add new webhook, paste the URL shown on this page, set a secret and pick payment events.',
      },
      { description: 'Paste the key ID, key secret and webhook secret here.' },
    ],
    links: [
      {
        kind: 'API_KEYS',
        label: 'Razorpay API keys',
        url: 'https://dashboard.razorpay.com/app/website-app-settings/api-keys',
      },
      {
        kind: 'OTHER',
        label: 'Razorpay webhooks',
        url: 'https://dashboard.razorpay.com/app/website-app-settings/webhooks',
      },
      {
        kind: 'BILLING',
        label: 'Razorpay settlements',
        url: 'https://dashboard.razorpay.com/app/settlements',
      },
    ],
  },
  {
    provider: 'paypal',
    label: 'PayPal',
    billing: {
      need: 'PERMISSION',
      message:
        'A separate billing API key is not required. PayPal fees are read through the Transaction Search API with the current client ID and secret, once Transaction search is ticked under the app’s features.',
    },
    steps: [
      {
        description:
          'Sign in at developer.paypal.com and open Apps & Credentials (Sandbox or Live).',
      },
      { description: 'Choose Create App, then copy the Client ID and Secret.' },
      {
        description:
          'In the app, add a webhook with the URL shown on this page and copy its Webhook ID.',
      },
      { description: 'Optionally tick Transaction search under Features so fees can be read.' },
    ],
    links: [
      {
        kind: 'API_KEYS',
        label: 'PayPal apps and credentials',
        url: 'https://developer.paypal.com/dashboard/applications',
      },
      {
        kind: 'BILLING',
        label: 'PayPal activity',
        url: 'https://www.paypal.com/myaccount/activities',
      },
      {
        kind: 'DOCS',
        label: 'PayPal REST documentation',
        url: 'https://developer.paypal.com/api/rest/',
      },
    ],
  },
  {
    provider: 'payoneer',
    label: 'Payoneer',
    billing: {
      need: 'SAME_KEY',
      message:
        'A separate billing API key is not required. Payoneer Checkout reports its fees in the transaction details, read with the current API token.',
    },
    steps: [
      {
        description:
          'Ask your Payoneer account manager to enable Payoneer Checkout for the account.',
      },
      {
        description:
          'Sign in to the Payoneer Checkout merchant portal and open the API credentials (Developers) page.',
      },
      {
        description:
          'Copy the merchant code and create an API token; note the division if your account uses divisions.',
      },
      { description: 'Paste them here and choose Sandbox or Live.' },
    ],
    links: [
      { kind: 'DASHBOARD', label: 'Payoneer sign-in', url: 'https://login.payoneer.com' },
      {
        kind: 'DOCS',
        label: 'Payoneer Checkout documentation',
        url: 'https://checkoutdocs.payoneer.com',
      },
    ],
  },
];
