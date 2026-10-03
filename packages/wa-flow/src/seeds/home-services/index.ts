/**
 * HomeEase Services — home repairs and cleaning on WhatsApp: book a technician from the rate
 * card, describe a problem in free text (AI), buy an annual care plan, track or change a
 * booking, and get the invoice, warranty claims and feedback after the job.
 */
import { defineDemo } from '../../author';
import { bookService } from './book-service';
import { carePlans } from './care-plans';
import { COMPANY } from './data';
import { describeProblem } from './describe-problem';
import { invoice } from './invoice';
import { trackBooking } from './track-booking';

export const homeServices = defineDemo({
  key: 'home-services',
  industry: 'Home Services',
  business: {
    name: COMPANY.name,
    tagline: 'Plumbers, electricians, AC repair and cleaning on WhatsApp',
    category: 'Home services',
    about:
      'Background-verified plumbers, electricians, AC technicians, cleaners, carpenters and pest-control experts across the city. Fixed prices, a start code for every visit and a warranty on every job.',
    icon: 'tools',
    accent: 'blue',
    verified: true,
    phone: COMPANY.phone,
    email: 'help@homeease.example',
    website: COMPANY.website,
    address: COMPANY.address,
    hours: 'Visits 8 am – 8 pm, all 7 days · Emergency desk 24×7',
  },
  greeting: 'Hi {{user.firstName}} 👋 Welcome to HomeEase Services.',
  menuText:
    'What needs fixing today? Pick an option below, or just type the problem — e.g. "AC not cooling".',
  menuButton: 'View services',
  workflows: [bookService, describeProblem, trackBooking, carePlans, invoice],
});
