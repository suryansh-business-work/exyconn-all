import { place } from './place';
import {
  GCC_ACCENT,
  GCC_CALCULATOR_PATH,
  GCC_FAMILY,
  GCC_SOURCES,
  gccCards,
  gccChapter,
  gccTable,
} from './gcc-shared';

/** Parent-company hubs and the six Indian GCC cities the hero globe joins (real coordinates). */
const HUBS = {
  newYork: { lat: 40.71, lon: -74.01 },
  london: { lat: 51.51, lon: -0.13 },
  frankfurt: { lat: 50.11, lon: 8.68 },
  singapore: { lat: 1.35, lon: 103.82 },
  sydney: { lat: -33.87, lon: 151.21 },
};

const CITIES = {
  bengaluru: { lat: 12.97, lon: 77.59 },
  hyderabad: { lat: 17.39, lon: 78.49 },
  pune: { lat: 18.52, lon: 73.86 },
  chennai: { lat: 13.08, lon: 80.27 },
  noida: { lat: 28.54, lon: 77.39 },
  gurugram: { lat: 28.46, lon: 77.03 },
};

const ARCS = [
  { from: HUBS.newYork, to: CITIES.bengaluru },
  { from: HUBS.newYork, to: CITIES.hyderabad },
  { from: HUBS.newYork, to: CITIES.pune },
  { from: HUBS.london, to: CITIES.bengaluru },
  { from: HUBS.london, to: CITIES.gurugram },
  { from: HUBS.london, to: CITIES.chennai },
  { from: HUBS.frankfurt, to: CITIES.pune },
  { from: HUBS.frankfurt, to: CITIES.noida },
  { from: HUBS.singapore, to: CITIES.chennai },
  { from: HUBS.singapore, to: CITIES.hyderabad },
  { from: HUBS.sydney, to: CITIES.bengaluru },
  { from: HUBS.sydney, to: CITIES.noida },
];

const CALCULATOR_LINK = { label: 'Model it in the calculator', href: GCC_CALCULATOR_PATH };

/** 1 — the hero: the globe joining parent-company hubs to the Indian GCC cities. */
export const GCC_GUIDE_HERO = place('company.stage', {
  family: GCC_FAMILY,
  variant: 'hero',
  crumbs: [
    { label: 'Home', href: '/' },
    { label: 'GCC in India cost guide', href: '' },
  ],
  title: 'Build Your Next Growth Engine. Enable Your GCC in India.',
  lede: 'A practical guide to what a Global Capability Centre in India takes to set up and run — the models, cities, people, technology and compliance behind the budget — with a calculator to model your own.',
  primary: { label: 'Calculate Your GCC Cost', href: GCC_CALCULATOR_PATH, external: false },
  secondary: { label: 'Talk to Exyconn', href: '/contact', external: false },
  scene: { shapes: ['globe'], data: { globe: { arcs: ARCS } }, accent: GCC_ACCENT },
  globeFromMarkets: false,
});

/** 2 — what drives the investment. */
export const GCC_GUIDE_DRIVERS = gccChapter(
  {
    index: 1,
    id: 'cost-drivers',
    label: 'Cost drivers',
    title: 'What shapes the investment',
    lede: 'No two centres cost the same. These are the decisions that move the budget most — settle them first, then put numbers on them.',
  },
  [
    gccCards(
      [
        {
          title: 'Headcount and role mix',
          text: 'In a people-led centre, salaries and employer costs tend to be the largest recurring line, so the number of roles and their mix matter more than any other input.',
        },
        {
          title: 'Seniority and scarce skills',
          text: 'Senior engineers, AI/ML specialists and leadership hires cost more and take longer to fill than mid-level roles. Plan their hiring months realistically.',
        },
        {
          title: 'Establishment model',
          text: 'Captive, managed, build-operate-transfer or hybrid decides who carries setup, operations and risk — and whether you pay upfront or through partner fees.',
        },
        {
          title: 'City and office model',
          text: 'The city shapes talent access and salary levels; the office model decides between per-seat charges and rent, fit-out and deposits.',
        },
        {
          title: 'Ramp-up speed',
          text: 'Hiring faster brings delivery forward but concentrates recruitment fees, hardware and onboarding costs in the first months.',
        },
        {
          title: 'Technology and AI intensity',
          text: 'Cloud, GPU capacity, AI model usage and per-seat software grow with the team and with how much of the work is AI-assisted.',
        },
        {
          title: 'Compliance footprint',
          text: 'Entity setup, tax filings, transfer pricing, labour law and data protection add advisory and recurring compliance costs.',
        },
        {
          title: 'Shift pattern and working model',
          text: 'Extended or round-the-clock coverage adds shift allowances, transport and facility hours; hybrid work changes how many seats you need.',
        },
        {
          title: 'Escalation and currency',
          text: 'Salary increments, rent escalation, technology growth and exchange-rate moves change the three-year picture more than year one.',
          link: CALCULATOR_LINK,
        },
      ],
      3,
    ),
  ],
);

/** 3 — the four establishment models. */
export const GCC_GUIDE_MODELS = gccChapter(
  {
    index: 2,
    id: 'models',
    label: 'Establishment models',
    title: 'Captive, managed, build-operate-transfer or hybrid',
    lede: 'The model decides who owns the entity, who runs operations and how cost is spread over time. Each suits a different appetite for control and risk.',
  },
  [
    gccCards(
      [
        {
          title: 'Captive',
          text: 'Your own Indian entity, team, office and operations from day one. Full control and full responsibility.',
        },
        {
          title: 'Managed GCC',
          text: "A partner's entity and operations host your dedicated team; you direct the work and pay a recurring fee.",
        },
        {
          title: 'Build-operate-transfer (BOT)',
          text: 'A partner builds and runs the centre, then transfers the entity, people and assets to you on agreed terms.',
        },
        {
          title: 'Hybrid',
          text: 'You own the core functions and partner for the rest — for example payroll, facilities or recruitment.',
        },
      ],
      4,
    ),
    place('gcc.table'),
  ],
);

/** 4 — cities and office models (qualitative; no rent figures without a current quote). */
export const GCC_GUIDE_CITIES = gccChapter(
  {
    index: 3,
    id: 'cities',
    label: 'City and office strategy',
    title: 'Where to locate, and how to house the team',
    lede: 'Six cities host most new GCCs. Shortlist by the talent you need, then choose an office model that matches your ramp-up and commitment.',
  },
  [
    gccTable(
      'The six leading GCC cities, compared qualitatively',
      ['City', 'Talent depth', 'Ecosystem', 'Office market notes'],
      [
        [
          'Bengaluru',
          'Deep pool across software, product and AI/ML, including senior talent; competition for it can be intense',
          'Dense start-up, product and multinational R&D community',
          'Wide choice of Grade A, managed and coworking space; prime micro-markets carry a premium',
        ],
        [
          'Hyderabad',
          'Broad engineering, data and enterprise technology talent',
          'Large multinational technology and GCC presence; active state support for the sector',
          'Extensive newer Grade A supply in planned technology corridors',
        ],
        [
          'Pune',
          'Strong engineering, enterprise IT and engineering R&D talent',
          'IT services, product and automotive and manufacturing technology companies; well-known universities',
          'Established IT parks and SEZs; often considered a cost-conscious alternative to the largest metros',
        ],
        [
          'Chennai',
          'Deep engineering, SaaS and operations talent, strong in support and finance functions',
          'SaaS, manufacturing technology and financial services operations',
          'IT corridors with campus-style parks',
        ],
        [
          'Noida',
          'Large engineering and operations talent pool across the National Capital Region',
          'IT services, product and digital companies near Delhi',
          'Large IT/ITES parks and SEZs with newer infrastructure',
        ],
        [
          'Gurugram',
          'Business, consulting, finance, product and engineering talent across the National Capital Region',
          "Corporate headquarters, consulting and digital firms close to Delhi's international airport",
          'Premium business districts alongside newer peripheral options',
        ],
      ],
      'A qualitative starting point, not a ranking. Rents, salaries and availability vary by micro-market and over time — use current broker quotes and salary benchmarks in the calculator.',
    ),
    gccCards(
      [
        {
          title: 'Coworking',
          text: 'Flexible desks or private cabins priced per seat, with internet, utilities and housekeeping included.',
          points: [
            'Fastest to start',
            'Short commitments',
            'Limited branding and security control',
          ],
        },
        {
          title: 'Managed office',
          text: 'A dedicated, branded floor fitted out and run by an operator for a per-seat fee over a fixed term.',
          points: [
            'No fit-out capital',
            'Your own space and security',
            'Longer lock-in than coworking',
          ],
        },
        {
          title: 'Leased office',
          text: 'You lease space, fit it out and run it, paying rent and building charges per square foot.',
          points: [
            'Most control',
            'Fit-out, furniture and deposits upfront',
            'Multi-year commitment',
          ],
        },
        {
          title: 'Dedicated facility',
          text: 'A built-to-suit building or campus for large, long-term centres with specific security or lab needs.',
          points: ['Full control of the site', 'Highest capital and lead time'],
        },
        {
          title: 'Remote-first',
          text: 'No central office: people work from home, with occasional meeting or coworking space.',
          points: ['No rent or fit-out', 'Higher spend on collaboration, equipment and travel'],
        },
      ],
      3,
    ),
  ],
);

/** 5 — compensation and workforce planning, with the statutory employer costs cited. */
export const GCC_GUIDE_PEOPLE = gccChapter(
  {
    index: 4,
    id: 'people',
    label: 'Compensation and workforce',
    title: 'The fully loaded cost of every hire',
    lede: 'Gross salary is only the start. A planning budget adds employer contributions, provisions, benefits and the cost of hiring and replacing people.',
  },
  [
    gccCards(
      [
        {
          title: 'Gross salary',
          text: 'Annual cost-to-company by role and seniority, grown by yearly increments. Use current benchmarks for your city and skills.',
        },
        {
          title: 'Employer provident fund',
          text: 'The employer contributes 12% of PF wages: 8.33% goes to the pension scheme (EPS) on wages capped at ₹15,000 a month, the rest to the provident fund (EPF), plus EDLI and administrative charges. Confirm with a qualified adviser.',
          link: { label: 'EPFO contribution rates', href: GCC_SOURCES.epf },
        },
        {
          title: 'The Labour Codes',
          text: 'India\'s four Labour Codes took effect on 21 November 2025. "Wages" must be at least 50% of total remuneration, which affects the PF and gratuity base; state rules are still being notified. Confirm with a qualified adviser.',
          link: { label: 'Littler: the Labour Codes in brief', href: GCC_SOURCES.labourCodes },
        },
        {
          title: 'Gratuity provision',
          text: "Gratuity is 15 days' wages per completed year of service — a monthly provision of about 4.81% of wages (15 ÷ 26 ÷ 12). Confirm with a qualified adviser.",
          link: { label: 'Littler: the Labour Codes in brief', href: GCC_SOURCES.labourCodes },
        },
        {
          title: 'Benefits and allowances',
          text: 'Health insurance and other benefits, plus shift allowances for extended or night coverage.',
        },
        {
          title: 'Recruitment, attrition and ramp-up',
          text: 'Agency or referral fees on each hire, backfills for people who leave, and the months a team takes to reach full strength.',
          link: CALCULATOR_LINK,
        },
      ],
      3,
    ),
  ],
);
