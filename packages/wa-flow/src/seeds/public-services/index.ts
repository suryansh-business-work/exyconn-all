/**
 * Sundarpur Civic Centre — a fictional municipal office. Four workflows: counter token
 * booking, application status (with fee payment and the certificate), document checklists,
 * and civic issue reporting.
 */
import { defineDemo } from '../../author';
import { checklist } from './checklist';
import { complaint } from './complaint';
import { CIVIC } from './data';
import { status } from './status';
import { token } from './token';

export const publicServices = defineDemo({
  key: 'public-services',
  industry: 'Government / Public Services',
  business: {
    name: 'Sundarpur Civic Centre',
    tagline: 'Tokens, applications and civic complaints on WhatsApp',
    category: 'Public service',
    about:
      'Citizen services of the fictional town of Sundarpur: book a counter token, track your application, check the documents to bring and report civic issues — without standing in line.',
    icon: 'government',
    accent: 'blue',
    verified: true,
    phone: CIVIC.phone,
    email: 'help@sundarpur-civic.example',
    website: CIVIC.website,
    address: CIVIC.address,
    hours: 'Mon–Sat, 10 am – 5 pm · Helpline 24×7',
  },
  greeting: 'Namaste {{user.firstName}} 🙏 Welcome to Sundarpur Civic Centre.',
  menuText: 'How can we help you today? Pick a service below, or just type what you need.',
  menuButton: 'View services',
  workflows: [token, status, checklist, complaint],
});
