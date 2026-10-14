/**
 * The GCC calculator's preset: what a new estimate starts from. FX rates are left empty on
 * purpose — the reader fetches or enters them, the site never invents one. The AI price list
 * holds only list prices checked against the provider's page (source, URL and date on each).
 */
import {
  GCC_ENTERPRISE_SCENARIO,
  GCC_LEAN_SCENARIO,
  GCC_STANDARD_SCENARIO,
} from './gcc.copy-preset-scenarios';

const CLAUDE_PRICING_SOURCE = {
  kind: 'verified',
  note: 'Anthropic first-party API list price',
  url: 'https://platform.claude.com/docs/en/about-claude/pricing',
  checkedOn: '2026-10-14',
};

const claude = (
  id: string,
  model: string,
  [inputPerMTok, outputPerMTok, cachedInputPerMTok]: readonly [number, number, number],
  note: string,
) => ({
  id: `anthropic-${id}`,
  provider: 'Anthropic',
  model,
  kind: 'chat',
  currency: 'USD',
  inputPerMTok,
  outputPerMTok,
  cachedInputPerMTok,
  batchDiscountPct: 50,
  effectiveDate: '2026-10-06',
  source: { ...CLAUDE_PRICING_SOURCE, note: `${CLAUDE_PRICING_SOURCE.note}${note}` },
});

export const GCC_PRICING = [
  claude('claude-opus-5-5', 'Claude Opus 5.5', [4, 20, 0.2], ''),
  claude('claude-sonnet-5-5', 'Claude Sonnet 5.5', [2, 10, 0.2], ''),
  claude('claude-haiku-5-5', 'Claude Haiku 5.5', [0.1, 0.5, 0.01], ', prompts up to 100K tokens'),
];

export const GCC_CITIES = ['Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Noida', 'Gurugram'];

export const GCC_DEPARTMENTS = [
  'Software Engineering',
  'AI/ML and Data Science',
  'Product and Design',
  'QA and Automation',
  'DevOps, Cloud and Cybersecurity',
  'Finance and Accounting',
  'HR and Recruitment',
  'Customer Support',
  'Legal and Compliance',
  'Administration',
  'Leadership and Management',
];

export const GCC_CALCULATOR_PROPS = {
  text: {
    label: 'GCC cost calculator',
    loading: 'Loading the calculator…',
    noscript:
      'The calculator runs in your browser and needs JavaScript. Turn JavaScript on, or talk to Exyconn for an estimate.',
    invalid:
      'The calculator configuration is invalid, so the calculator cannot be shown. Please try again later or contact Exyconn.',
  },
  preset: {
    reportingCurrency: 'INR',
    currencies: ['INR', 'USD', 'GBP', 'EUR', 'SGD', 'AUD', 'CAD', 'JPY'],
    fxRates: [],
    scenarios: [GCC_LEAN_SCENARIO, GCC_STANDARD_SCENARIO, GCC_ENTERPRISE_SCENARIO],
    pricing: GCC_PRICING,
    cities: GCC_CITIES,
    departments: GCC_DEPARTMENTS,
  },
};
