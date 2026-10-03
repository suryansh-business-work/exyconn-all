/**
 * The Saffron Table — table reservations (step by step or typed in one line), pre-orders and
 * takeaway, the menu with free-text food questions, and managing a booking.
 */
import { defineDemo } from '../../author';
import { RESTAURANT } from './data';
import { menu } from './menu';
import { myTable } from './my-table';
import { preorder } from './preorder';
import { reserve } from './reserve';

export const restaurant = defineDemo({
  key: 'restaurant',
  industry: 'Restaurant',
  business: {
    name: 'The Saffron Table',
    tagline: 'Reserve a table, pre-order and takeaway on WhatsApp',
    category: 'Restaurant',
    about:
      'A North Indian and Awadhi restaurant with a rooftop terrace, private booths and a private dining room. Reserve, pre-order your platter and manage your booking right here.',
    icon: 'restaurant',
    accent: 'orange',
    verified: true,
    phone: RESTAURANT.phone,
    email: 'reservations@saffrontable.example',
    website: RESTAURANT.website,
    address: RESTAURANT.address,
    hours: 'Lunch 12–3:30 pm · Dinner 7–11:30 pm, all days',
  },
  greeting: 'Hi {{user.firstName}} 🍽️ Welcome to The Saffron Table.',
  menuText: 'How can we help? Pick an option below, or type something like "table for 4 tonight".',
  menuButton: 'View options',
  workflows: [reserve, preorder, menu, myTable],
});
