/**
 * Skyline Realty — property enquiry filtered by budget and locality (or typed in one line),
 * site visits with free pickup, agent callbacks and a home-loan EMI calculator.
 */
import { defineDemo } from '../../author';
import { callback } from './callback';
import { OFFICE } from './data';
import { find } from './find';
import { loan } from './loan';
import { visit } from './visit';

export const realEstate = defineDemo({
  key: 'real-estate',
  industry: 'Real Estate',
  business: {
    name: 'Skyline Realty',
    tagline: 'Find homes, book site visits and talk to an agent on WhatsApp',
    category: 'Real estate agency',
    about:
      'RERA-registered apartments, villas and rentals across West Hyderabad, with free site-visit pickups, relationship managers and home-loan help from partner banks.',
    icon: 'realestate',
    accent: 'blue',
    verified: true,
    phone: OFFICE.phone,
    email: 'homes@skylinerealty.example',
    website: OFFICE.website,
    address: OFFICE.address,
    hours: 'All days, 9 am – 8 pm',
  },
  greeting: 'Hi {{user.firstName}} 🏡 Welcome to Skyline Realty.',
  menuText:
    'How can we help you find your home? Pick an option, or describe what you are looking for.',
  menuButton: 'View options',
  workflows: [find, visit, callback, loan],
});
