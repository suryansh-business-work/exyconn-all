import { place } from './place';
import {
  GCC_CALCULATOR_PATH,
  GCC_FAMILY,
  GCC_SOURCES,
  gccCards,
  gccChapter,
  gccPresetHref,
  gccTable,
} from './gcc-shared';

const REVIEW = 'Requires professional review for your structure and facts.';

/** 6 — AI, technology, cloud and security, with the cited per-token list prices. */
export const GCC_GUIDE_TECHNOLOGY = gccChapter(
  {
    index: 5,
    id: 'technology',
    label: 'AI and technology',
    title: 'AI, cloud, software, hardware and security',
    lede: 'Technology cost behaves in three ways — fixed, variable and one-time — and AI usage is the most variable of all. Budget each the way it is billed.',
  },
  [
    gccCards(
      [
        {
          title: 'Per-million-token pricing',
          text: 'AI model APIs bill input tokens (what you send) and output tokens (what the model writes) separately, each priced per million tokens (MTok). Output usually costs several times more than input.',
        },
        {
          title: 'Cached input',
          text: 'Repeated context — long instructions, documents, code — can be cached and re-read at a fraction of the normal input price.',
        },
        {
          title: 'Batch pricing',
          text: 'Work that can wait for asynchronous processing can be sent in batches at a discount; Anthropic lists batch processing at 50% off.',
        },
        {
          title: 'Example list prices',
          text: 'Anthropic API list prices, per million tokens (input / output / cached input): Claude Opus 5.5 $4 / $20 / $0.20; Claude Sonnet 5.5 $2 / $10 / $0.20; Claude Haiku 5.5 $0.10 / $0.50 / $0.01 for prompts up to 100K tokens. Checked 14 October 2026; prices change, so check the source.',
          link: { label: 'Anthropic pricing', href: GCC_SOURCES.claudePricing },
        },
      ],
      2,
    ),
    gccTable(
      'How technology costs behave',
      ['Cost type', 'Examples', 'How it grows', 'How to plan it'],
      [
        [
          'Fixed',
          'Per-seat subscriptions and licences, monitoring, VPN and network redundancy',
          'With headcount and plan changes',
          'Seats × price, reviewed at each renewal',
        ],
        [
          'Variable',
          'AI model usage, cloud compute, GPU capacity, storage and backups',
          'With usage, data and the share of work that is AI-assisted',
          'A monthly budget, or token volumes × list price, with a growth rate',
        ],
        [
          'One-time',
          'Laptops and devices, security tooling setup, network installation',
          'With each new position, then a replacement cycle',
          'Hardware per new hire, refreshed every few years',
        ],
      ],
      'Cybersecurity — endpoint protection, identity, email security and monitoring — belongs in the budget from the first hire, not after an incident.',
    ),
  ],
);

/** 7 — legal, entity, tax, HR and compliance: always "requires professional review". */
export const GCC_GUIDE_LEGAL = gccChapter(
  {
    index: 6,
    id: 'compliance',
    label: 'Legal, tax and compliance',
    title: 'Entity setup, tax, HR and compliance',
    lede: 'Plan for these from the start. This section lists what to budget for; it is not legal or tax advice, and every item needs review by qualified professionals.',
  },
  [
    gccCards(
      [
        {
          title: 'Entity incorporation',
          text: `Choosing and registering the Indian entity (typically a private limited company or a branch structure), directors, registered office and registrations. ${REVIEW}`,
        },
        {
          title: 'FEMA and cross-border',
          text: `Foreign investment, fund transfers and reporting under India's Foreign Exchange Management Act. ${REVIEW}`,
        },
        {
          title: 'Transfer pricing',
          text: `Pricing and documenting services between the Indian centre and its parent on arm's-length terms. ${REVIEW}`,
        },
        {
          title: 'GST',
          text: `Registration, invoicing and returns under the Goods and Services Tax, including how exported services are treated. ${REVIEW}`,
        },
        {
          title: 'Labour codes and HR',
          text: `Employment contracts, policies, wage structures and registrations under the four Labour Codes and state rules. ${REVIEW}`,
          link: { label: 'Littler: the Labour Codes in brief', href: GCC_SOURCES.labourCodes },
        },
        {
          title: 'Data protection',
          text: `Handling personal data under India's Digital Personal Data Protection Act, 2023 and the laws of the countries whose data you process. ${REVIEW}`,
        },
        {
          title: 'Intellectual property',
          text: `Assigning work product to the right entity, protecting confidential information and registering IP where needed. ${REVIEW}`,
        },
      ],
      3,
    ),
  ],
);

/** 8 — one-time setup vs recurring operating vs refundable deposits. */
export const GCC_GUIDE_COST_TYPES = gccChapter(
  {
    index: 7,
    id: 'cost-types',
    label: 'Setup, running and deposits',
    title: 'One-time, recurring and refundable',
    lede: 'Three kinds of money leave the bank. Keeping them apart answers two different questions: what the centre costs, and how much cash you need on day one.',
  },
  [place('gcc.cost-flow')],
);

/** 9 — three-year planning, scenarios and escalation. */
export const GCC_GUIDE_PLANNING = gccChapter(
  {
    index: 8,
    id: 'planning',
    label: 'Three-year planning',
    title: 'Scenarios, scaling and escalation',
    lede: 'Plan three years, not one. Start from the scenario closest to your ambition, then adjust; every default in the calculator is an illustrative assumption to replace.',
  },
  [
    place('company.link-cards', {
      layout: 'grid',
      indexPrefix: '',
      more: 'Open this scenario',
      items: [
        {
          title: 'Lean',
          text: 'About 25 people in coworking space, run with a managed model — a focused team to prove the case.',
          href: gccPresetHref('lean'),
        },
        {
          title: 'Standard',
          text: 'About 75 people across engineering, AI, product and support functions in a managed office.',
          href: gccPresetHref('standard'),
        },
        {
          title: 'Enterprise',
          text: 'About 200 people in leased space with a planned expansion and a full support organisation.',
          href: gccPresetHref('enterprise'),
        },
      ],
    }),
    gccCards(
      [
        {
          title: 'Salary inflation',
          text: 'Annual increments compound on the whole payroll; set your own rate per role or for the centre.',
        },
        {
          title: 'Rent escalation',
          text: 'Leases and seat agreements usually escalate on a schedule; read the clause and enter it.',
        },
        {
          title: 'Technology growth',
          text: 'Cloud and AI spend grows with usage, not only with headcount.',
        },
        {
          title: 'Contingency',
          text: 'A percentage on setup and operating cost for what the plan cannot yet see.',
        },
        {
          title: 'Exchange rates',
          text: 'Costs are incurred in rupees and reported in your currency; a moving rate changes the reported total. The calculator never invents a rate — you enter or fetch it.',
        },
      ],
      3,
    ),
  ],
);

/** 10 — FAQs, methodology, assumptions and disclaimer, then the consultation call. */
export const GCC_GUIDE_FAQ = gccChapter(
  {
    index: 9,
    id: 'faq',
    label: 'FAQs and methodology',
    title: 'Questions, method and assumptions',
    lede: '',
  },
  [
    place('legal.faq', {
      items: [
        {
          question: 'What is a Global Capability Centre (GCC)?',
          answer:
            'A GCC is an offshore centre a company sets up to deliver work for its own business — engineering, AI, data, operations or support — rather than buying it as an outsourced service.',
        },
        {
          question: 'How much does it cost to set up a GCC in India?',
          answer:
            'It depends on headcount, roles, city, office model and establishment model, so this guide does not quote an average. The calculator builds an estimate from your own inputs; its defaults are illustrative assumptions you should replace with quotes and payroll data.',
        },
        {
          question: 'Which establishment model is the cheapest?',
          answer:
            'None is always cheapest. Captive centres carry more upfront cost and operational effort; managed and build-operate-transfer models spread cost through partner fees. Compare them over three years for your own scale.',
        },
        {
          question: 'Which statutory employer costs should I plan for?',
          answer:
            'Employer provident fund contributions, a gratuity provision and the wage definition under the Labour Codes in force since 21 November 2025, plus any state levies. The figures in this guide cite their sources; confirm them with a qualified adviser.',
        },
        {
          question: 'Does the calculator store or send my data?',
          answer:
            'Your estimate is saved only in your browser. Nothing is sent to Exyconn unless you choose to email it, share it or request a consultation.',
        },
        {
          question: 'How can Exyconn help?',
          answer:
            'Exyconn can support feasibility, location assessment, launch management, technology and AI enablement, recruitment coordination, HR and administration operations, and ongoing management of the centre. Services are quoted on request.',
        },
      ],
    }),
    place('company.statement', {
      paragraphs: [
        'How the estimate is calculated: every amount is computed in Indian rupees month by month over 60 months, then totalled for the forecast window you choose and converted at the exchange rates you provide. One-time costs fall in the month they are due; recurring costs escalate on each anniversary; refundable deposits count towards the cash you need, never towards cost. Headcount ramps from each role’s hiring month, and attrition is replaced at a recruitment fee. Taxes are shown separately, before any input-tax credit, and contingency applies to pre-tax cost.',
        'Disclaimer: this guide and the calculator give indicative planning information, not a quotation, an offer, or legal, tax or financial advice. Default values are illustrative assumptions unless a source is cited. Confirm legal, tax and statutory items with qualified professionals before you decide.',
      ],
      points: [
        'Statutory rates: EPFO contribution rates and the Payment of Gratuity rules as carried into the Code on Social Security, 2020.',
        'Labour Codes in effect from 21 November 2025; state rules are still being notified.',
        'AI prices: Anthropic API list prices, checked 14 October 2026.',
        'Everything else — salaries, seat prices, rents, budgets and fees — is an illustrative assumption.',
      ],
    }),
  ],
);

export const GCC_GUIDE_CTA = place('company.cta', {
  family: GCC_FAMILY,
  title: 'Plan your GCC in India with Exyconn',
  text: 'Bring your estimate to a consultation: we will review the assumptions, the model and the launch plan with you.',
  primary: { label: 'Calculate Your GCC Cost', href: GCC_CALCULATOR_PATH, external: false },
  secondary: { label: 'Talk to Exyconn', href: '/contact', external: false },
});
