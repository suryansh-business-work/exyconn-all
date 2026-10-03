/**
 * Glow & Co. Salon and Spa — services, stylists, slots, add-on upsell, packages, booking by
 * free text and reminders that can confirm, reschedule or cancel.
 */
import { defineDemo } from '../../author';
import { book } from './book';
import { SALON } from './data';
import { myBooking } from './my-booking';
import { packages } from './packages';
import { quickBook } from './quick-book';

export const salon = defineDemo({
  key: 'salon',
  industry: 'Salon & Spa',
  business: {
    name: 'Glow & Co. Salon and Spa',
    tagline: 'Book your stylist, packages and spa days on WhatsApp',
    category: 'Beauty salon',
    about:
      'A unisex salon and day spa for hair, skin, nails and massage, with senior stylists, a bridal studio and memberships. Book, reschedule and buy packages right here.',
    icon: 'beauty',
    accent: 'pink',
    verified: true,
    phone: SALON.phone,
    email: 'hello@glowandco.example',
    website: SALON.website,
    address: SALON.address,
    hours: 'Open all days, 10 am – 9 pm',
  },
  greeting: 'Hi {{user.firstName}} 💇 Welcome to Glow & Co.',
  menuText: 'What can we pamper you with today? Pick an option, or just type what you need.',
  menuButton: 'View options',
  workflows: [book, quickBook, packages, myBooking],
});
