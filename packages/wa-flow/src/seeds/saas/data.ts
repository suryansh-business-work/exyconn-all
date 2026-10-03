/**
 * Orbitly's dummy catalogue: the company, its products and plans, the BANT answers a lead
 * can give, the sales reps leads are routed to, and the meeting types customers can book.
 * Fictional names, numbers and `.example` links.
 */
import type { IconKey } from '../../visuals';

export const COMPANY = {
  name: 'Orbitly HQ, Pune',
  phone: '+91 20 4000 2200',
  salesPhone: '+91 20 4000 2210',
  supportPhone: '+91 20 4000 2299',
  address: '6th Floor, Riverside Tech Park, Kalyani Nagar, Pune 411006',
  lat: 18.5482,
  lng: 73.9026,
  website: 'https://orbitly.example',
  meet: 'https://meet.orbitly.example/demo',
  pricing: 'https://orbitly.example/pricing',
  caseStudy: 'https://orbitly.example/customers/kitekart',
  trial: 'https://app.orbitly.example/signup',
  status: 'https://status.orbitly.example',
} as const;

export interface SaasProduct {
  key: string;
  name: string;
  description: string;
  icon: IconKey;
}

export const PRODUCTS: readonly SaasProduct[] = [
  {
    key: 'crm',
    name: 'Sales CRM',
    description: 'Pipelines, lead scoring, quotes and WhatsApp follow-ups',
    icon: 'group',
  },
  {
    key: 'helpdesk',
    name: 'Support Desk',
    description: 'Tickets, SLAs, live chat and a self-service help centre',
    icon: 'support',
  },
  {
    key: 'marketing',
    name: 'Marketing Automation',
    description: 'Campaigns, journeys and segments across email and WhatsApp',
    icon: 'offer',
  },
  {
    key: 'analytics',
    name: 'Revenue Analytics',
    description: 'Forecasts, rep performance and board-ready dashboards',
    icon: 'search',
  },
  {
    key: 'suite',
    name: 'Orbitly Suite',
    description: 'All four products on one customer record',
    icon: 'business',
  },
];

/** BANT — Need. */
export const NEEDS = [
  { id: 'leads', title: 'Leads slip through', description: 'Enquiries live in inboxes and phones' },
  { id: 'tickets', title: 'Support is slow', description: 'No SLAs, tickets lost between teams' },
  { id: 'whatsapp', title: 'Automate WhatsApp', description: 'Reply, qualify and remind at scale' },
  { id: 'reports', title: 'No clear reporting', description: 'Forecasts live in spreadsheets' },
  { id: 'replace', title: 'Replace our tool', description: 'Moving off a costly or outgrown CRM' },
] as const;

/** BANT — Budget, per month. `budgetFit` feeds the lead score. */
export const BUDGETS = [
  { id: 'b-small', title: 'Under ₹25,000', description: 'Per month, all users', fit: 'yes' },
  { id: 'b-mid', title: '₹25,000 – ₹1 lakh', description: 'Per month, all users', fit: 'yes' },
  { id: 'b-large', title: '₹1 lakh – ₹5 lakh', description: 'Per month, all users', fit: 'yes' },
  { id: 'b-xl', title: 'Above ₹5 lakh', description: 'Enterprise agreement', fit: 'yes' },
  {
    id: 'b-none',
    title: 'Not decided yet',
    description: 'Still working out the budget',
    fit: 'no',
  },
] as const;

export interface Plan {
  id: string;
  name: string;
  price: string;
  seats: string;
  highlights: string;
}

export const PLANS: readonly Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₹499',
    seats: 'Up to 10',
    highlights: 'CRM, shared inbox, 1 WhatsApp number',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '₹999',
    seats: 'Up to 100',
    highlights: 'Automation, SLAs, 3 numbers, API',
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '₹1,799',
    seats: 'Unlimited',
    highlights: 'AI scoring, forecasts, sandbox, SSO',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    seats: 'Unlimited',
    highlights: 'Data residency, 99.95% SLA, named CSM',
  },
];

export interface Rep {
  /** Region key, matched by the routing condition. */
  region: string;
  regionName: string;
  description: string;
  agentName: string;
  name: string;
  role: string;
  phone: string;
  city: string;
}

/** One rep per region — one condition case each. International is the condition's `else`. */
export const REGIONAL_REPS: readonly Rep[] = [
  {
    region: 'north',
    regionName: 'North India',
    description: 'Delhi NCR, Punjab, Rajasthan, UP',
    agentName: 'Rohan Malhotra (Orbitly Sales)',
    name: 'Rohan Malhotra',
    role: 'Account Executive, North',
    phone: '+91 124 400 2231',
    city: 'Gurugram',
  },
  {
    region: 'south',
    regionName: 'South India',
    description: 'Bengaluru, Chennai, Hyderabad, Kochi',
    agentName: 'Divya Raghunathan (Orbitly Sales)',
    name: 'Divya Raghunathan',
    role: 'Account Executive, South',
    phone: '+91 80 4000 2232',
    city: 'Bengaluru',
  },
  {
    region: 'west',
    regionName: 'West India',
    description: 'Mumbai, Pune, Ahmedabad, Goa',
    agentName: 'Kunal Deshpande (Orbitly Sales)',
    name: 'Kunal Deshpande',
    role: 'Account Executive, West',
    phone: '+91 20 4000 2233',
    city: 'Pune',
  },
  {
    region: 'east',
    regionName: 'East India',
    description: 'Kolkata, Bhubaneswar, Guwahati, Patna',
    agentName: 'Ishita Banerjee (Orbitly Sales)',
    name: 'Ishita Banerjee',
    role: 'Account Executive, East',
    phone: '+91 33 4000 2234',
    city: 'Kolkata',
  },
];

export const INTERNATIONAL_REP: Rep = {
  region: 'intl',
  regionName: 'Outside India',
  description: 'Middle East, South-East Asia and beyond',
  agentName: 'Sameer Qadri (Orbitly Global)',
  name: 'Sameer Qadri',
  role: 'Global Account Executive',
  phone: '+91 20 4000 2235',
  city: 'Pune (serves Dubai and Singapore)',
};

export const ENTERPRISE_REP: Rep = {
  region: 'enterprise',
  regionName: 'Enterprise',
  description: '500+ employees, any region',
  agentName: 'Meera Krishnan (Enterprise Sales)',
  name: 'Meera Krishnan',
  role: 'Director, Enterprise Sales',
  phone: '+91 20 4000 2240',
  city: 'Pune',
};

export const ALL_REPS: readonly Rep[] = [...REGIONAL_REPS, INTERNATIONAL_REP, ENTERPRISE_REP];

export const SUPPORT_AGENT = {
  agentName: 'Neha (Orbitly Support)',
  name: 'Neha Joshi',
  role: 'Support Engineer, L2',
  phone: COMPANY.supportPhone,
} as const;

export const PARTNER_AGENT = {
  agentName: 'Arvind (Partnerships)',
  name: 'Arvind Saxena',
  role: 'Partner Manager',
  phone: '+91 20 4000 2250',
} as const;

/** The customer success manager existing customers meet. */
export const CSM = {
  name: 'Kavya Menon',
  role: 'Customer Success Manager',
  phone: '+91 20 4000 2260',
} as const;

export const SOLUTIONS = {
  name: 'Aditya Rao',
  role: 'Solutions Consultant',
  phone: '+91 20 4000 2215',
} as const;

export const MEETING_TYPES = [
  {
    id: 'qbr',
    title: 'Quarterly review',
    description: 'Usage, adoption and goals for next quarter',
  },
  {
    id: 'onboarding',
    title: 'Onboarding session',
    description: 'Set up pipelines, inboxes and users together',
  },
  {
    id: 'technical',
    title: 'Technical deep dive',
    description: 'APIs, webhooks, SSO and data migration',
  },
  { id: 'training', title: 'Team training', description: 'Live training for up to 25 users' },
  {
    id: 'renewal',
    title: 'Renewal discussion',
    description: 'Plans, seats and pricing for renewal',
  },
] as const;
