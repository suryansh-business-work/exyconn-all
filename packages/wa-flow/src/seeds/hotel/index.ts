/**
 * Coral Bay Resort — room enquiry, availability and booking (picked or typed), check-in and
 * arrival help, and requests during the stay read from free text.
 */
import { defineDemo } from '../../author';
import { book } from './book';
import { checkIn } from './check-in';
import { HOTEL } from './data';
import { rooms } from './rooms';
import { stayHelp } from './stay-help';

export const hotel = defineDemo({
  key: 'hotel',
  industry: 'Hotel',
  business: {
    name: 'Coral Bay Resort',
    tagline: 'Rooms, bookings, check-in and in-stay help on WhatsApp',
    category: 'Beach resort',
    about:
      'A 64-room beach resort with sea-view rooms, pool suites and family villas, an Ayurveda spa and a beach shack. Check availability, book, check in and ask for anything during your stay right here.',
    icon: 'hotel',
    accent: 'cyan',
    verified: true,
    phone: HOTEL.phone,
    email: 'stay@coralbay.example',
    website: HOTEL.website,
    address: HOTEL.address,
    hours: 'Front desk 24×7 · Check-in 2 pm · Checkout 11 am',
  },
  greeting: 'Hi {{user.firstName}} 🌴 Welcome to Coral Bay Resort.',
  menuText: 'How can we help with your stay? Pick an option, or just type what you need.',
  menuButton: 'View options',
  workflows: [rooms, book, checkIn, stayHelp],
});
