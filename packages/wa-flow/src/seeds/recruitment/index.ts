/**
 * Kaveri Talent Partners — a recruitment agency. Four workflows: find a job and pass the
 * screening questions, schedule the interview (with a reminder), submit documents for the
 * offer, and check an application's status.
 */
import { defineDemo } from '../../author';
import { apply } from './apply';
import { AGENCY } from './data';
import { documents } from './documents';
import { interview } from './interview';
import { status } from './status';

export const recruitment = defineDemo({
  key: 'recruitment',
  industry: 'Recruitment',
  business: {
    name: 'Kaveri Talent Partners',
    tagline: 'Jobs, interviews and offers on WhatsApp',
    category: 'Recruitment agency',
    about:
      'We hire for growing companies across technology, sales, design and operations. Apply, book interviews, send documents and receive your offer — all in this chat. We never charge candidates.',
    icon: 'person',
    accent: 'purple',
    verified: true,
    phone: AGENCY.phone,
    email: 'careers@kaveritalent.example',
    website: AGENCY.website,
    address: AGENCY.address,
    hours: 'Mon–Sat, 9:30 am – 7 pm',
  },
  greeting: 'Hi {{user.firstName}} 👋 Welcome to Kaveri Talent Partners.',
  menuText: 'Looking for your next role? Pick an option below, or just type what you need.',
  menuButton: 'View options',
  workflows: [apply, interview, documents, status],
});
