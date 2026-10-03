/**
 * Kosh Finserv — a loans, insurance and advisory firm. Four workflows: loan enquiry, insurance
 * consultation, document checklists and advisor appointments.
 */
import { defineDemo } from '../../author';
import { advisorAppointment } from './advisor-appointment';
import { FIRM } from './data';
import { documentChecklist } from './document-checklist';
import { insurance } from './insurance';
import { loanEnquiry } from './loan-enquiry';

export const finance = defineDemo({
  key: 'finance',
  industry: 'Financial Services',
  business: {
    name: 'Kosh Finserv',
    tagline: 'Loans, insurance and advice on WhatsApp',
    category: 'Financial services',
    about:
      'Loans from 30+ partner lenders, insurance from leading insurers, and certified advisors for investments, tax and retirement. Check eligibility, compare plans and send documents securely, right here.',
    icon: 'bank',
    accent: 'green',
    verified: true,
    phone: FIRM.phone,
    email: 'care@koshfinserv.example',
    website: FIRM.website,
    address: FIRM.address,
    hours: 'Mon–Sat, 9:30 am – 7 pm',
  },
  greeting: 'Hi {{user.firstName}} 👋 Welcome to Kosh Finserv.',
  menuText:
    'How can we help with your money today? Pick an option below, or just type what you need.',
  menuButton: 'View services',
  workflows: [loanEnquiry, insurance, documentChecklist, advisorAppointment],
});
