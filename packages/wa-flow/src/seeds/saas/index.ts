/**
 * Orbitly — a B2B SaaS (CRM + support desk). Four workflows: demo booking, BANT sales
 * qualification, meeting scheduling for customers, and lead routing to the right rep.
 */
import { defineDemo } from '../../author';
import { COMPANY } from './data';
import { demo } from './demo';
import { meeting } from './meeting';
import { qualify } from './qualify';
import { routing } from './routing';

export const saas = defineDemo({
  key: 'saas',
  industry: 'B2B / SaaS',
  business: {
    name: 'Orbitly',
    tagline: 'Demos, pricing and your sales team on WhatsApp',
    category: 'Software company',
    about:
      'Sales CRM, support desk and WhatsApp automation for growing teams. Data stored in India, live in under two weeks. Book a demo, get pricing or reach your rep right here.',
    icon: 'laptop',
    accent: 'indigo',
    verified: true,
    phone: COMPANY.phone,
    email: 'hello@orbitly.example',
    website: COMPANY.website,
    address: COMPANY.address,
    hours: 'Sales Mon–Sat, 10 am – 7 pm · Support 24×5',
  },
  greeting: 'Hi {{user.firstName}} 👋 Welcome to Orbitly.',
  menuText: 'How can we help? Pick an option below, or just type what you need.',
  menuButton: 'View options',
  workflows: [demo, qualify, meeting, routing],
});
