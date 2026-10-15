/**
 * Northstar Digital's dummy catalogue: the agency, its services, the project types it
 * estimates and its engagement models.
 * Fictional names, numbers and `.example` links.
 */
import type { IconKey } from '../../visuals';

export const AGENCY = {
  name: 'Northstar Digital Studio, Pune',
  phone: '+91 20 4855 3100',
  salesPhone: '+91 20 4855 3110',
  supportPhone: '+91 20 4855 3199',
  email: 'hello@northstar.example',
  address: '9th Floor, Skyline One, Baner Road, Pune 411045',
  lat: 18.5603,
  lng: 73.7769,
  website: 'https://northstar.example',
  meet: 'https://meet.northstar.example/consult',
  proposal: 'https://northstar.example/sample-proposal',
  pricing: 'https://northstar.example/engagement-models',
  status: 'https://status.northstar.example',
  salesAgent: 'Aarav (Northstar Sales)',
  supportAgent: 'Meera (Northstar On-call)',
} as const;

export interface Service {
  id: string;
  name: string;
  pitch: string;
  /** Starting price in rupees. */
  from: number;
  weeks: string;
  badge?: string;
  icon: IconKey;
}

export const SERVICES: readonly Service[] = [
  {
    id: 'web',
    name: 'Web & app development',
    pitch: 'Fast, accessible websites, portals and mobile apps on React, Next.js and Flutter.',
    from: 350000,
    weeks: '6–12 weeks',
    badge: 'Most popular',
    icon: 'laptop',
  },
  {
    id: 'ai',
    name: 'AI agents & automation',
    pitch: 'Chat, voice and workflow agents that answer customers and clear back-office work 24×7.',
    from: 250000,
    weeks: '4–8 weeks',
    badge: 'New',
    icon: 'chat',
  },
  {
    id: 'cloud',
    name: 'Cloud & DevOps',
    pitch: 'Migrations, CI/CD and cost-tuned AWS, Azure or GCP set-ups backed by a 99.9% SLA.',
    from: 200000,
    weeks: '3–6 weeks',
    icon: 'tools',
  },
  {
    id: 'design',
    name: 'UX & product design',
    pitch: 'Research, design systems and clickable prototypes people understand on first use.',
    from: 150000,
    weeks: '3–5 weeks',
    icon: 'mobile',
  },
  {
    id: 'data',
    name: 'Data & analytics',
    pitch: 'Warehouses, dashboards and forecasts that turn scattered data into weekly decisions.',
    from: 300000,
    weeks: '5–10 weeks',
    icon: 'report',
  },
  {
    id: 'growth',
    name: 'Digital marketing & SEO',
    pitch: 'Search, performance campaigns and conversion tuning measured on revenue, not clicks.',
    from: 60000,
    weeks: 'Monthly retainer',
    icon: 'offer',
  },
];

/** Project types the estimator prices; `tier` drives the budget-fit check. */
export const PROJECT_TYPES = [
  {
    id: 'website',
    title: 'Business website',
    description: 'Marketing site, CMS, SEO-ready',
    low: 250000,
    high: 600000,
    weeks: '4–6 weeks',
    tier: 'small',
  },
  {
    id: 'webapp',
    title: 'Web app or portal',
    description: 'Customer or partner portal with dashboards',
    low: 800000,
    high: 2000000,
    weeks: '10–16 weeks',
    tier: 'large',
  },
  {
    id: 'mobile',
    title: 'Mobile app',
    description: 'iOS and Android from one codebase',
    low: 900000,
    high: 2200000,
    weeks: '12–18 weeks',
    tier: 'large',
  },
  {
    id: 'ecom',
    title: 'E-commerce store',
    description: 'Catalogue, payments and logistics',
    low: 500000,
    high: 1200000,
    weeks: '8–10 weeks',
    tier: 'small',
  },
  {
    id: 'agent',
    title: 'AI agent or chatbot',
    description: 'Website, WhatsApp or voice agent',
    low: 300000,
    high: 900000,
    weeks: '4–8 weeks',
    tier: 'small',
  },
  {
    id: 'migrate',
    title: 'Cloud migration',
    description: 'Move, modernise and automate',
    low: 400000,
    high: 1500000,
    weeks: '6–10 weeks',
    tier: 'large',
  },
] as const;

export const MODELS = [
  {
    id: 'fixed',
    title: 'Fixed-price project',
    description: 'Clear scope, fixed cost and dates',
    how: 'We agree scope, milestones and a fixed price up front. You pay per milestone delivered.',
    best: 'well-defined websites, MVPs and migrations',
    rate: 'from ₹2.5 lakh per project',
  },
  {
    id: 'team',
    title: 'Dedicated team',
    description: 'Your own squad, billed monthly',
    how: 'A cross-functional squad — PM, designers and engineers — works only on your roadmap.',
    best: 'products that ship every sprint',
    rate: 'from ₹4.8 lakh per month',
  },
  {
    id: 'tm',
    title: 'Time & materials',
    description: 'Pay for hours used, change freely',
    how: 'Weekly sprints billed on actual hours, with a live burn-down you can see any time.',
    best: 'evolving scope and R&D',
    rate: '₹1,800 – ₹3,200 per hour',
  },
  {
    id: 'managed',
    title: 'Managed services',
    description: 'Run, monitor and improve 24×7',
    how: 'We run your platform with SLAs, monitoring, security patches and a monthly roadmap.',
    best: 'live products that must never sleep',
    rate: 'from ₹75,000 per month',
  },
] as const;
