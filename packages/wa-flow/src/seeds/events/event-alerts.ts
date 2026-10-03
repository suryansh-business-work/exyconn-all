/**
 * Event alerts: city → interests → how often → opted in; a later push brings an early-bird
 * event card that books straight into the ticket flow, snoozes, or unsubscribes.
 */
import { defineWorkflow } from '../../author';
import { CITIES, EVENTS, INTERESTS } from './data';

const ALERT = 'alert';
const FEATURED = EVENTS[EVENTS.length - 1];

export const eventAlerts = defineWorkflow({
  key: 'event-alerts',
  name: 'Event alerts',
  description: 'New shows, early-bird offers and presale access',
  keywords: ['alert', 'alerts', 'notify', 'updates', 'subscribe', 'early bird', 'presale'],
  nodes: [
    {
      id: 'city',
      type: 'list',
      data: {
        header: 'Event alerts',
        text: 'Be first in line, {{user.firstName}}: subscribers get presale access and early-bird prices 24 hours before everyone else. Which city should we watch for you?',
        button: 'Cities',
        sections: [
          {
            id: 'cities',
            title: 'Cities',
            rows: CITIES.map((c) => ({ ...c, set: { alertCity: c.title } })),
          },
        ],
      },
      next: Object.fromEntries(CITIES.map((c) => [c.id, 'interest'])),
    },
    {
      id: 'interest',
      type: 'list',
      data: {
        text: 'What would you like to hear about in {{alertCity}}?',
        button: 'Interests',
        sections: [
          {
            id: 'interests',
            title: 'Interests',
            rows: INTERESTS.map((i) => ({ ...i, set: { interest: i.title } })),
          },
        ],
      },
      next: Object.fromEntries(INTERESTS.map((i) => [i.id, 'freq'])),
    },
    {
      id: 'freq',
      type: 'buttons',
      data: {
        text: 'How often should we message you?',
        footer: 'Never more than one message a day',
        buttons: [
          { id: 'weekly', title: 'Weekly digest', set: { freq: 'a weekly digest every Thursday' } },
          { id: 'big', title: 'Big events only', set: { freq: 'big events and presales only' } },
          {
            id: 'all',
            title: 'Every new event',
            set: { freq: 'every new event as it is announced' },
          },
        ],
      },
      next: { weekly: 'subscribed', big: 'subscribed', all: 'subscribed' },
    },
    {
      id: 'subscribed',
      type: 'text',
      data: {
        complete: true,
        set: { subId: '$id:AL' },
        text: 'You are subscribed.\n*City:* {{alertCity}}\n*Interests:* {{interest}}\n*How often:* {{freq}}',
      },
      next: 'opt-out',
    },
    {
      id: 'opt-out',
      type: 'notice',
      data: { text: 'Tap Stop alerts on any alert to unsubscribe. We never share your number.' },
      next: ALERT,
    },
    {
      id: ALERT,
      type: 'reminder',
      data: {
        afterMs: 15_000,
        label: 'New event in your city',
        note: 'Real use: when a matching event is announced.',
      },
      next: { next: 'sub-end', later: 'a-card' },
    },
    {
      id: 'sub-end',
      type: 'end',
      data: { text: 'Done. The next presale lands right here.', showMenu: true },
    },
    {
      id: 'a-card',
      type: 'product',
      data: {
        product: {
          id: 'presale',
          title: FEATURED.title,
          subtitle: `${FEATURED.subtitle} · ${FEATURED.venue}, ${FEATURED.city}`,
          price: FEATURED.tiers[0].price - 250,
          mrp: FEATURED.tiers[0].price,
          badge: 'Presale · 24 hours',
          image: {
            icon: FEATURED.icon,
            accent: FEATURED.accent,
            title: FEATURED.title,
            subtitle: 'Early bird',
          },
        },
      },
      next: 'a-actions',
    },
    {
      id: 'a-actions',
      type: 'buttons',
      data: {
        header: 'Presale is open',
        text: 'Hi {{user.firstName}}, new dates just dropped and your early-bird price is live for the next 24 hours.',
        buttons: [
          { id: 'book', title: 'Book now' },
          { id: 'snooze', title: 'Remind me later' },
          { id: 'stop', title: 'Stop alerts' },
        ],
      },
      next: { book: 'to-book', snooze: 'snoozed', stop: 'stop' },
    },
    {
      id: 'to-book',
      type: 'jump',
      data: { workflowKey: 'book-tickets' },
    },
    {
      id: 'snoozed',
      type: 'text',
      data: { text: 'Sure, we will nudge you again before the presale closes.' },
      next: ALERT,
    },
    {
      id: 'stop',
      type: 'end',
      data: {
        text: 'You are unsubscribed from event alerts ({{subId}}). You can turn them back on from the menu any time.',
        showMenu: true,
      },
    },
  ],
});
