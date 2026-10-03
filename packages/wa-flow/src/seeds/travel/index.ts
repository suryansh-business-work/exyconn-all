/**
 * TrailNest Holidays — a travel agency. Four workflows: a free-text trip enquiry read by AI,
 * package selection and booking, a consultation with a travel expert, and itinerary sharing.
 */
import { defineDemo } from '../../author';
import { consultation } from './consultation';
import { AGENCY } from './data';
import { enquiry } from './enquiry';
import { itinerary } from './itinerary';
import { packages } from './packages';

export const travel = defineDemo({
  key: 'travel',
  industry: 'Travel',
  business: {
    name: 'TrailNest Holidays',
    tagline: 'Trip ideas, packages, experts and itineraries on WhatsApp',
    category: 'Travel agency',
    about:
      'A full-service travel agency for holidays across India and abroad: tailor-made trips, ready packages, visa help and a 24×7 helpline while you travel.',
    icon: 'flight',
    accent: 'blue',
    verified: true,
    phone: AGENCY.phone,
    email: 'hello@trailnest.example',
    website: AGENCY.website,
    address: AGENCY.address,
    hours: 'Mon–Sat, 10 am – 7 pm · Trip helpline 24×7',
  },
  greeting: 'Hi {{user.firstName}} 👋 Welcome to TrailNest Holidays.',
  menuText: 'Where shall we take you next? Pick an option below, or just tell us your trip idea.',
  menuButton: 'View options',
  workflows: [enquiry, packages, consultation, itinerary],
});
