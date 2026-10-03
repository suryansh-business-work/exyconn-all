/**
 * Manage a reservation: the table booked in this chat (or a sample one) → change guests,
 * change time, running late, cancel, directions, or feedback after the meal.
 */
import { defineWorkflow } from '../../author';
import { HOST, PARTY_SIZES, RESTAURANT } from './data';

const ACTIONS = 'actions';
const DAY = 'day';
const UPDATED = 'updated';

export const myTable = defineWorkflow({
  key: 'my-table',
  name: 'My reservation',
  description: 'Change guests or time, running late, cancel or feedback',
  keywords: [
    'my reservation',
    'my table',
    'change booking',
    'running late',
    'cancel table',
    'feedback',
  ],
  nodes: [
    {
      id: 'has-booking',
      type: 'condition',
      data: {
        note: 'Reuse a table booked in this chat; otherwise show a sample one.',
        cases: [{ id: 'none', var: 'bookingId', op: 'empty' }],
      },
      next: { none: 'sample', else: 'current' },
    },
    {
      id: 'sample',
      type: 'delay',
      data: {
        ms: 400,
        set: {
          bookingId: '$id:ST',
          guests: '$pick:2|4|6',
          day: '$days:1',
          dayLabel: '{{day|day}}',
          slot: '{{day}}',
          seating: '$pick:Indoor dining|Rooftop terrace|Private booth',
          table: '$int:4:28',
        },
      },
      next: 'current',
    },
    {
      id: 'current',
      type: 'ticket',
      data: {
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Your reservation',
          subtitle: 'The Saffron Table, Hauz Khas Village',
          fields: [
            { label: 'Name', value: '{{user.fullName}}' },
            { label: 'Guests', value: '{{guests}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Seating', value: '{{seating}}' },
            { label: 'Table', value: 'T-{{table}}' },
          ],
          qrData: 'saffrontable://table/{{bookingId}}',
        },
      },
      next: ACTIONS,
    },
    {
      id: ACTIONS,
      type: 'list',
      data: {
        text: 'What would you like to change, {{user.firstName}}?',
        button: 'Options',
        sections: [
          {
            id: 'change',
            title: 'Change',
            rows: [
              { id: 'guests', title: 'Number of guests' },
              { id: 'time', title: 'Date or time' },
              { id: 'cancel', title: 'Cancel reservation' },
            ],
          },
          {
            id: 'tonight',
            title: 'On the day',
            rows: [
              { id: 'late', title: 'Running late', description: 'We hold tables for 15 minutes' },
              { id: 'directions', title: 'Directions and parking' },
              { id: 'feedback', title: 'Rate your meal', description: 'After your visit' },
            ],
          },
          { id: 'help', title: 'Help', rows: [{ id: 'host', title: 'Talk to the host' }] },
        ],
      },
      next: {
        guests: 'guests',
        time: DAY,
        cancel: 'cancel',
        late: 'late',
        directions: 'pin',
        feedback: 'rate',
        host: 'host',
      },
    },
    {
      id: 'guests',
      type: 'list',
      data: {
        text: 'How many guests now?',
        button: 'Guests',
        sections: [
          {
            id: 'party',
            title: 'Party size',
            rows: PARTY_SIZES.map((p) => ({
              id: p.id,
              title: p.title,
              set: { guests: p.label, partySize: String(p.size) },
            })),
          },
        ],
      },
      next: Object.fromEntries(PARTY_SIZES.map((p) => [p.id, UPDATED])),
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Pick the new day:',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, var: 'day' },
      },
      next: { pick: 'slot' },
    },
    {
      id: 'slot',
      type: 'list',
      data: {
        text: 'Free tables on {{dayLabel}} (lunch and dinner):',
        button: 'Choose time',
        sections: [
          {
            id: 'more',
            title: 'More options',
            rows: [{ id: 'other-day', title: 'Pick another day' }],
          },
        ],
        dynamic: {
          kind: 'slots',
          dayVar: 'day',
          from: 12,
          to: 23,
          stepMin: 60,
          take: 9,
          var: 'slot',
        },
      },
      next: { pick: 'new-time', 'other-day': DAY },
    },
    {
      id: 'new-time',
      type: 'text',
      data: { text: 'Moved to {{dayLabel}} at {{slot|time}}.' },
      next: UPDATED,
    },
    {
      id: UPDATED,
      type: 'ticket',
      data: {
        complete: true,
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Reservation updated',
          subtitle: 'The Saffron Table, Hauz Khas Village',
          fields: [
            { label: 'Guests', value: '{{guests}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Seating', value: '{{seating}}' },
          ],
          qrData: 'saffrontable://table/{{bookingId}}?v=2',
        },
        caption: 'Use this updated QR when you arrive.',
      },
      next: 'updated-end',
    },
    {
      id: 'updated-end',
      type: 'end',
      data: { text: 'All updated. See you soon!', showMenu: true },
    },
    {
      id: 'cancel',
      type: 'buttons',
      data: {
        text: 'Cancel your table for {{guests}} on {{dayLabel}}? Any deposit is refunded in full.',
        buttons: [
          { id: 'yes', title: 'Yes, cancel' },
          { id: 'move', title: 'Move it instead' },
          { id: 'keep', title: 'Keep it' },
        ],
      },
      next: { yes: 'cancelled', move: DAY, keep: 'kept' },
    },
    {
      id: 'cancelled',
      type: 'end',
      data: {
        complete: true,
        text: 'Your reservation is cancelled. We hope to host you soon.',
        showMenu: true,
      },
    },
    { id: 'kept', type: 'end', data: { text: 'Great — your table stays booked.', showMenu: true } },
    {
      id: 'late',
      type: 'buttons',
      data: {
        text: 'Thanks for the heads-up. About how late?',
        buttons: [
          { id: 'l15', title: '15 minutes', set: { lateBy: '15' } },
          { id: 'l30', title: '30 minutes', set: { lateBy: '30' } },
          { id: 'l45', title: '45+ minutes' },
        ],
      },
      next: { l15: 'late-ok', l30: 'late-ok', l45: DAY },
    },
    {
      id: 'late-ok',
      type: 'end',
      data: {
        complete: true,
        text: 'No problem — table T-{{table}} is held for {{lateBy}} extra minutes.',
        showMenu: true,
      },
    },
    {
      id: 'pin',
      type: 'location',
      data: {
        location: {
          name: RESTAURANT.name,
          address: RESTAURANT.address,
          lat: RESTAURANT.lat,
          lng: RESTAURANT.lng,
        },
        caption:
          'Paid parking at the village entrance. Walk straight past the Deer Park gate — we are on the left.',
      },
      next: 'pin-cta',
    },
    {
      id: 'pin-cta',
      type: 'cta',
      data: {
        text: 'Need help finding us?',
        actions: [
          { kind: 'url', title: 'Open in Maps', url: RESTAURANT.directions },
          { kind: 'call', title: 'Call us', phone: RESTAURANT.phone },
        ],
      },
      next: 'pin-end',
    },
    { id: 'pin-end', type: 'end', data: { showMenu: true } },
    {
      id: 'rate',
      type: 'buttons',
      data: {
        text: 'How was your meal at The Saffron Table?',
        buttons: [
          { id: 'great', title: 'Loved it' },
          { id: 'ok', title: 'It was okay' },
          { id: 'bad', title: 'Disappointing' },
        ],
      },
      next: { great: 'review', ok: 'improve', bad: 'improve' },
    },
    {
      id: 'review',
      type: 'cta',
      data: {
        complete: true,
        text: 'Thank you! A quick review helps other diners find us.',
        actions: [{ kind: 'url', title: 'Write a review', url: RESTAURANT.review }],
      },
      next: 'review-end',
    },
    {
      id: 'review-end',
      type: 'end',
      data: { text: 'Come back soon, {{user.firstName}}!', showMenu: true },
    },
    {
      id: 'improve',
      type: 'input',
      data: {
        prompt: 'Sorry to hear that. What could we have done better?',
        var: 'feedback',
        kind: 'text',
      },
      next: 'improve-ack',
    },
    {
      id: 'improve-ack',
      type: 'end',
      data: {
        complete: true,
        set: { feedbackId: '$id:FB' },
        text: 'Thank you for telling us. Our manager will call you within a day (reference {{feedbackId}}).',
        showMenu: true,
      },
    },
    {
      id: 'host',
      type: 'handoff',
      data: {
        agentName: HOST.agentName,
        text: 'Hi {{user.firstName}}, Kunal here. I have reservation {{bookingId}} open — what can I do for you?',
      },
      next: 'host-end',
    },
    { id: 'host-end', type: 'end', data: { showMenu: true } },
  ],
});
