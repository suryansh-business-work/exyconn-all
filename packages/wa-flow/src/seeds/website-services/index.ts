/**
 * Northstar Digital — an IT and digital services agency, with the chat agent on its own
 * website (`channel: 'website'`). Seven workflows: services, project estimate, consultation
 * booking, case studies, pricing models, client support and talk to sales.
 */
import { defineDemo } from '../../author';
import { caseStudies } from './case-studies';
import { consult } from './consult';
import { AGENCY } from './data';
import { estimate } from './estimate';
import { pricing } from './pricing';
import { sales } from './sales';
import { services } from './services';
import { support } from './support';

export const websiteServices = defineDemo({
  key: 'website-services',
  channel: 'website',
  industry: 'IT & digital services',
  business: {
    name: 'Northstar Digital',
    tagline: 'Websites, apps, AI agents and cloud — designed, built and run',
    category: 'IT services company',
    about:
      'A product studio of 120 designers and engineers building web and mobile apps, AI agents and cloud platforms for growing companies. Explore services, get an estimate or book a free consultation right here.',
    icon: 'laptop',
    accent: 'indigo',
    verified: true,
    phone: AGENCY.phone,
    email: AGENCY.email,
    website: AGENCY.website,
    address: AGENCY.address,
    hours: 'Sales Mon–Fri, 10 am – 7 pm IST · Support 24×7',
  },
  greeting: 'Hi {{user.firstName}} 👋 I am Nova, Northstar’s assistant.',
  menuText:
    'I can show our work, price your project or book time with an expert. What would you like to do?',
  menuButton: 'How can I help?',
  workflows: [services, estimate, consult, caseStudies, pricing, support, sales],
});
