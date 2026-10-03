/**
 * Spotlight Live — events and workshops. Five workflows: ticket booking with a QR entry pass,
 * workshop seats, private-event planning (free text read by AI), managing a booking, and
 * event alerts that arrive later.
 */
import { defineDemo } from '../../author';
import { bookTickets } from './book-tickets';
import { COMPANY } from './data';
import { eventAlerts } from './event-alerts';
import { myTickets } from './my-tickets';
import { planEvent } from './plan-event';
import { workshop } from './workshop';

export const events = defineDemo({
  key: 'events',
  industry: 'Events',
  business: {
    name: COMPANY.name,
    tagline: 'Tickets, workshops and private events on WhatsApp',
    category: 'Events & entertainment',
    about:
      'Concerts, stand-up, festivals and meetups across India, weekend workshops with expert mentors, and a planning team for weddings, parties and corporate events. Book, pay and get your QR pass right here.',
    icon: 'event',
    accent: 'purple',
    verified: true,
    phone: COMPANY.phone,
    email: COMPANY.email,
    website: COMPANY.website,
    address: COMPANY.address,
    hours: 'Chat 24×7 · Helpdesk 10 am – 10 pm, all days',
  },
  greeting: 'Hi {{user.firstName}} 👋 Welcome to Spotlight Live.',
  menuText: 'What are you in the mood for? Pick an option below, or just type what you need.',
  menuButton: 'View options',
  workflows: [bookTickets, workshop, planEvent, myTickets, eventAlerts],
});
