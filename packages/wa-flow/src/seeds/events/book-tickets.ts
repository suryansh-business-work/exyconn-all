/**
 * Event tickets: event carousel → ticket tier → show date and time → how many → attendee →
 * review → order summary and payment → QR entry pass, calendar, venue pin and a show-day
 * reminder that offers the pass again, directions, or a transfer/refund.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import type { Product } from '../../schema';
import { COMPANY, EVENTS, QUANTITIES, rupees, type LiveEvent, type Tier } from './data';

const ROUTE = 'route';
const DAY = 'day';
const WHO = 'who';
const REVIEW = 'review';
const TICKET = 'ticket';
const R_END = 'r-end';

/** Everything later nodes say about the chosen event. */
function eventCard(event: LiveEvent): Product {
  return {
    id: event.key,
    title: event.title,
    subtitle: `${event.subtitle} · ${event.city}`,
    price: event.tiers[0].price,
    badge: event.badge,
    image: { icon: event.icon, accent: event.accent, title: event.title, subtitle: event.city },
    buttonTitle: 'Book tickets',
    set: {
      eventKey: event.key,
      event: event.title,
      venue: event.venue,
      venueAddress: event.address,
      city: event.city,
      gate: event.gate,
      mapUrl: event.map,
      ageLimit: event.ageLimit,
      doorsMin: String(event.doorsMin),
    },
  };
}

function tierRow(tier: Tier) {
  return {
    id: tier.id,
    title: tier.name,
    description: `${tier.description} · ${rupees(tier.price)}`,
    set: { tier: tier.name, tierPrice: String(tier.price) },
  };
}

function tierList(event: LiveEvent): AuthorNode {
  return {
    id: `tiers-${event.key}`,
    type: 'list',
    data: {
      header: event.title,
      text: '*{{event}}* at {{venue}}, {{city}}. Age limit: {{ageLimit}}.\nChoose your ticket type — prices are per person and include GST.',
      footer: 'Tickets are non-transferable at the gate',
      button: 'Ticket types',
      sections: [{ id: 'tiers', title: 'Ticket types', rows: event.tiers.map(tierRow) }],
    },
    next: Object.fromEntries(event.tiers.map((t) => [t.id, DAY])),
  };
}

/** One condition case per event but the last, which is the `else`. */
function eventRoute(id: string, prefix: string, note: string): AuthorNode {
  const cased = EVENTS.slice(0, -1);
  const last = EVENTS[EVENTS.length - 1].key;
  return {
    id,
    type: 'condition',
    data: {
      note,
      cases: cased.map((e) => ({ id: e.key, var: 'eventKey', op: 'eq' as const, value: e.key })),
    },
    next: {
      ...Object.fromEntries(cased.map((e) => [e.key, `${prefix}${e.key}`])),
      else: `${prefix}${last}`,
    },
  };
}

function venuePin(event: LiveEvent): AuthorNode {
  return {
    id: `pin-${event.key}`,
    type: 'location',
    data: {
      location: { name: event.venue, address: event.address, lat: event.lat, lng: event.lng },
      caption: 'Entry at {{gate}}. Cabs and autos drop at the same gate; carry a photo ID.',
    },
    next: 'remind',
  };
}

/** The pending summary and the paid receipt for one ticket count. */
function orderPair(q: (typeof QUANTITIES)[number]): AuthorNode[] {
  const items = [
    { id: 'tickets', name: '{{tier}} — {{event}}', qty: q.qty, price: '{{tierPrice}}' },
  ];
  const adjustments = [{ id: 'fee', label: 'Convenience fee', amount: '{{convFee}}' }];
  return [
    {
      id: `sum-${q.id}`,
      type: 'order',
      data: {
        set: { orderId: '$id:SLP' },
        order: {
          orderId: '{{orderId}}',
          title: 'Ticket order',
          items,
          adjustments,
          status: 'pending',
          payTitle: 'Pay now',
        },
      },
      next: { pay: `paid-${q.id}` },
    },
    {
      id: `paid-${q.id}`,
      type: 'order',
      data: {
        set: { bookingId: '$id:SL', block: '$pick:A|B|C|D' },
        order: {
          orderId: '{{orderId}}',
          title: 'Payment received',
          items,
          adjustments,
          status: 'paid',
        },
      },
      next: TICKET,
    },
  ];
}

const PASS_FIELDS = [
  { label: 'Event', value: '{{event}}' },
  { label: 'Name', value: '{{attendee}}' },
  { label: 'Date', value: '{{dayLabel}}' },
  { label: 'Show', value: '{{slotLabel}}' },
  { label: 'Ticket', value: '{{tier}} × {{qty}}' },
  { label: 'Block', value: '{{block}}' },
  { label: 'Entry', value: '{{gate}}' },
  { label: 'Age limit', value: '{{ageLimit}}' },
];
const PASS_QR = 'spotlight://pass/{{bookingId}}?show={{slot}}&qty={{qty}}';

export const bookTickets = defineWorkflow({
  key: 'book-tickets',
  name: 'Book event tickets',
  description: 'Concerts, comedy, festivals and meetups near you',
  keywords: ['ticket', 'tickets', 'book tickets', 'concert', 'comedy', 'show', 'festival', 'event'],
  nodes: [
    {
      id: 'events',
      type: 'carousel',
      data: {
        text: 'Hi {{user.firstName}}, here is what is on this month. Swipe through and tap *Book tickets* on the one you like.',
        cards: EVENTS.map(eventCard),
      },
      next: Object.fromEntries(EVENTS.map((e) => [e.key, ROUTE])),
    },
    eventRoute(ROUTE, 'tiers-', 'One ticket-tier list per event; the last event is the else.'),
    ...EVENTS.map(tierList),
    {
      id: DAY,
      type: 'list',
      data: {
        text: '*{{event}}* runs on these dates in {{city}}. Which day would you like to go?',
        button: 'Show dates',
        sections: [],
        dynamic: { kind: 'days', count: 7, var: 'day' },
      },
      next: { pick: 'show' },
    },
    {
      id: 'show',
      type: 'list',
      data: {
        text: 'Shows on {{dayLabel}} (IST). Doors open {{doorsMin}} minutes before the start.',
        button: 'Show times',
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
          from: 16,
          to: 22,
          stepMin: 90,
          take: 4,
          var: 'slot',
        },
      },
      next: { pick: 'qty', 'other-day': DAY },
    },
    {
      id: 'qty',
      type: 'buttons',
      data: {
        text: '*{{tier}}* at {{tierPrice|money}} each, {{dayLabel}} at {{slotLabel}}.\nHow many tickets?',
        footer: 'Need more than 4? Pick 4 and book again',
        buttons: QUANTITIES.map((q) => ({
          id: q.id,
          title: q.title,
          set: { qty: String(q.qty), convFee: String(q.fee) },
        })),
      },
      next: Object.fromEntries(QUANTITIES.map((q) => [q.id, WHO])),
    },
    {
      id: WHO,
      type: 'buttons',
      data: {
        text: 'Whose name should be on the booking? The lead attendee shows the QR at the gate.',
        buttons: [
          {
            id: 'self',
            title: 'Me',
            set: { attendee: '{{user.fullName}}', attendeePhone: '{{user.phone}}' },
          },
          { id: 'other', title: 'Someone else' },
        ],
      },
      next: { self: 'own-phone', other: 'a-name' },
    },
    {
      id: 'own-phone',
      type: 'condition',
      data: {
        note: 'The signed-in profile may have no phone; ask for one then.',
        cases: [{ id: 'missing', var: 'attendeePhone', op: 'empty' }],
      },
      next: { missing: 'ask-phone', else: REVIEW },
    },
    {
      id: 'ask-phone',
      type: 'input',
      data: {
        prompt: 'Which mobile number should we send the entry pass and show updates to?',
        var: 'attendeePhone',
        kind: 'phone',
      },
      next: REVIEW,
    },
    {
      id: 'a-name',
      type: 'input',
      data: { prompt: "Please type the lead attendee's full name.", var: 'attendee', kind: 'name' },
      next: 'a-phone',
    },
    {
      id: 'a-phone',
      type: 'input',
      data: {
        prompt: "{{attendee}}'s mobile number? We send a copy of the pass there.",
        var: 'attendeePhone',
        kind: 'phone',
      },
      next: REVIEW,
    },
    {
      id: REVIEW,
      type: 'buttons',
      data: {
        header: 'Check your booking',
        text: '*Event:* {{event}}\n*Venue:* {{venue}}, {{city}}\n*When:* {{dayLabel}} at {{slotLabel}}\n*Tickets:* {{qty}} × {{tier}} ({{tierPrice|money}} each)\n*Name:* {{attendee}}\n*Mobile:* {{attendeePhone}}',
        footer: 'Full refund up to 48 hours before the show',
        buttons: [
          { id: 'confirm', title: 'Confirm & pay' },
          { id: 'change', title: 'Change show' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'secure', change: DAY, cancel: 'not-booked' },
    },
    {
      id: 'secure',
      type: 'notice',
      data: {
        text: 'Payments are processed by our payment partner. Spotlight Live never asks for your card PIN or OTP in this chat.',
      },
      next: 'qty-route',
    },
    {
      id: 'qty-route',
      type: 'condition',
      data: {
        note: 'Order quantities are fixed numbers, so each ticket count has its own summary.',
        cases: [
          { id: 'one', var: 'qty', op: 'eq', value: '1' },
          { id: 'two', var: 'qty', op: 'eq', value: '2' },
        ],
      },
      next: { one: 'sum-one', two: 'sum-two', else: 'sum-four' },
    },
    ...QUANTITIES.flatMap(orderPair),
    {
      id: TICKET,
      type: 'ticket',
      data: {
        complete: true,
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Entry pass',
          subtitle: '{{venue}}, {{city}}',
          fields: PASS_FIELDS,
          qrData: PASS_QR,
        },
        caption:
          'This QR admits all {{qty}} of you. Keep the brightness up at the gate — screenshots work too.',
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Add the show to your calendar, or open directions to the venue.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: '{{event}} — {{tier}}',
              start: '{{slot}}',
              durationMin: 150,
              location: '{{venueAddress}}',
            },
          },
          { kind: 'url', title: 'Get directions', url: '{{mapUrl}}' },
        ],
      },
      next: 'pin-route',
    },
    eventRoute('pin-route', 'pin-', 'One venue pin per event; the last event is the else.'),
    ...EVENTS.map(venuePin),
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Show-day reminder',
        note: 'Real use: the morning of the show.',
      },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'You are in, {{user.firstName}}! We will remind you on the day of the show.',
        showMenu: true,
      },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Today is show day',
        text: '*{{event}}* is today at {{slotLabel}}, {{venue}}.\nDoors open {{doorsMin}} minutes early · entry at {{gate}}.\nBooking {{bookingId}} · {{qty}} × {{tier}}.',
        buttons: [
          { id: 'pass', title: 'Show my pass' },
          { id: 'directions', title: 'Directions' },
          { id: 'cant', title: "Can't make it" },
        ],
      },
      next: { pass: 'r-pass', directions: 'r-dir', cant: 'r-cant' },
    },
    {
      id: 'r-pass',
      type: 'ticket',
      data: {
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Entry pass',
          subtitle: '{{venue}}, {{city}}',
          fields: PASS_FIELDS,
          qrData: PASS_QR,
        },
        caption: 'Here is your pass again. Enjoy the show, {{user.firstName}}!',
      },
      next: R_END,
    },
    {
      id: 'r-dir',
      type: 'cta',
      data: {
        text: '{{venue}}\n{{venueAddress}}\nEntry at {{gate}}. Parking fills up an hour before the show — a cab is quicker.',
        actions: [
          { kind: 'url', title: 'Open in maps', url: '{{mapUrl}}' },
          { kind: 'call', title: 'Call helpdesk', phone: COMPANY.phone },
        ],
      },
      next: R_END,
    },
    {
      id: 'r-cant',
      type: 'buttons',
      data: {
        text: 'Sorry you cannot make it. You can pass the tickets to a friend, or cancel for a refund if the show is more than 48 hours away.',
        buttons: [
          { id: 'manage', title: 'Transfer or refund' },
          { id: 'keep', title: 'Keep my tickets' },
        ],
      },
      next: { manage: 'to-manage', keep: R_END },
    },
    {
      id: 'to-manage',
      type: 'jump',
      data: { workflowKey: 'my-tickets' },
    },
    {
      id: R_END,
      type: 'end',
      data: { text: 'Have a great time, {{user.firstName}}.', showMenu: true },
    },
    {
      id: 'not-booked',
      type: 'end',
      data: {
        text: 'No tickets were booked. Seats are not held, so book again soon if you change your mind.',
        showMenu: true,
      },
    },
  ],
});
