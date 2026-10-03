/**
 * Table reservation, step by step (guests → day → lunch/dinner → slot) or in one typed line
 * read by an `ai` node ("table for 4 kal raat 8 baje"). Then seating → occasion → guest →
 * review → a deposit for large parties → QR confirmation, calendar, map pin, a pre-order offer
 * and a reminder push that confirms, flags running late or cancels.
 */
import { defineWorkflow } from '../../author';
import {
  EVENTS_DESK,
  HOST,
  LARGE_PARTY,
  OCCASIONS,
  PARTY_SIZES,
  RESTAURANT,
  SEATING,
} from './data';

const GUESTS = 'guests';
const SIZE_CHECK = 'size-check';
const HAS_WHEN = 'has-when';
const DAY = 'day';
const SEAT = 'seating';
const EVENTS = 'events';

export const reserve = defineWorkflow({
  key: 'reserve',
  name: 'Reserve a table',
  description: 'Lunch or dinner, indoor or rooftop, for any occasion',
  keywords: ['reserve', 'book a table', 'table for', 'table booking', 'dinner', 'lunch'],
  nodes: [
    {
      id: 'how',
      type: 'buttons',
      data: {
        header: 'Reserve a table',
        text: 'Wonderful, {{user.firstName}}! Pick the options step by step, or type it in one line like "table for 4 kal raat 8 baje".',
        footer: 'Lunch 12–3:30 pm · Dinner 7–11:30 pm',
        buttons: [
          { id: 'steps', title: 'Step by step', set: { whenMs: '', guests: '', partySize: '' } },
          { id: 'type', title: 'Type it' },
        ],
      },
      next: { steps: GUESTS, type: 'ai' },
    },
    {
      id: 'ai',
      type: 'ai',
      data: {
        set: { whenMs: '', guests: '', partySize: '' },
        prompt: 'Go ahead — how many of you, and when?',
        intents: [
          { id: 'reserve', description: 'Wants a table for a date, time or number of guests' },
          { id: 'event', description: 'A private party, corporate event or more than 12 guests' },
          { id: 'human', description: 'Wants to talk to a person or has a special request' },
        ],
        entities: [
          { name: 'guests', kind: 'number', description: 'Number of guests, as a number' },
          { name: 'when', kind: 'datetime', description: 'Date and time of the reservation' },
        ],
        retry: 'Sorry, I could not read that one.',
      },
      next: { reserve: 'has-guests', event: EVENTS, human: 'host', fallback: GUESTS },
    },
    {
      id: 'has-guests',
      type: 'condition',
      data: { cases: [{ id: 'known', var: 'guests', op: 'notEmpty' }] },
      next: { known: 'ai-size', else: GUESTS },
    },
    {
      id: 'ai-size',
      type: 'delay',
      data: { ms: 300, set: { partySize: '{{guests}}' } },
      next: SIZE_CHECK,
    },
    {
      id: GUESTS,
      type: 'list',
      data: {
        text: 'How many guests, including you?',
        footer: 'More than 12? Our events team will help',
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
          {
            id: 'bigger',
            title: 'Bigger groups',
            rows: [{ id: 'big', title: '13 or more', description: 'Private dining and set menus' }],
          },
        ],
      },
      next: { ...Object.fromEntries(PARTY_SIZES.map((p) => [p.id, SIZE_CHECK])), big: EVENTS },
    },
    {
      id: SIZE_CHECK,
      type: 'condition',
      data: {
        note: 'Typed party sizes above 12 go to the events team.',
        cases: [{ id: 'huge', var: 'partySize', op: 'gt', value: '12' }],
      },
      next: { huge: EVENTS, else: HAS_WHEN },
    },
    {
      id: HAS_WHEN,
      type: 'condition',
      data: {
        note: 'whenMs is set by the AI reader when it resolved a date and time.',
        cases: [{ id: 'known', var: 'whenMs', op: 'notEmpty' }],
      },
      next: { known: 'ai-when', else: DAY },
    },
    {
      id: 'ai-when',
      type: 'text',
      data: {
        set: { slot: '{{whenMs}}', dayLabel: '{{whenMs|day}}' },
        text: 'Checking a table for {{guests}} on {{dayLabel}} at {{slot|time}}… good news, it is available.',
      },
      next: SEAT,
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Table for {{guests}}. Which day?',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, var: 'day' },
      },
      next: { pick: 'meal' },
    },
    {
      id: 'meal',
      type: 'buttons',
      data: {
        text: 'Lunch or dinner on {{dayLabel}}?',
        buttons: [
          { id: 'lunch', title: 'Lunch' },
          { id: 'dinner', title: 'Dinner' },
          { id: 'other', title: 'Another day' },
        ],
      },
      next: { lunch: 'lunch-slot', dinner: 'dinner-slot', other: DAY },
    },
    {
      id: 'lunch-slot',
      type: 'list',
      data: {
        text: 'Free lunch tables on {{dayLabel}}:',
        button: 'Choose time',
        sections: [
          { id: 'more', title: 'More options', rows: [{ id: 'dinner', title: 'Dinner instead' }] },
        ],
        dynamic: {
          kind: 'slots',
          dayVar: 'day',
          from: 12,
          to: 15,
          stepMin: 30,
          take: 6,
          var: 'slot',
        },
      },
      next: { pick: SEAT, dinner: 'dinner-slot' },
    },
    {
      id: 'dinner-slot',
      type: 'list',
      data: {
        text: 'Free dinner tables on {{dayLabel}}:',
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
          from: 19,
          to: 23,
          stepMin: 30,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: SEAT, 'other-day': DAY },
    },
    {
      id: SEAT,
      type: 'list',
      data: {
        text: 'Where would you like to sit?',
        button: 'Seating',
        sections: [
          {
            id: 'areas',
            title: 'Seating areas',
            rows: SEATING.map((s) => ({ ...s, set: { seating: s.title } })),
          },
        ],
      },
      next: Object.fromEntries(SEATING.map((s) => [s.id, 'occasion'])),
    },
    {
      id: 'occasion',
      type: 'list',
      data: {
        text: 'Celebrating something? We love to make it special.',
        button: 'Occasion',
        sections: [
          {
            id: 'occasions',
            title: 'Occasion',
            rows: OCCASIONS.map((o) => ({
              id: o.id,
              title: o.title,
              set: { occasion: o.title, special: o.special },
            })),
          },
        ],
      },
      next: Object.fromEntries(OCCASIONS.map((o) => [o.id, 'special'])),
    },
    {
      id: 'special',
      type: 'condition',
      data: { cases: [{ id: 'yes', var: 'special', op: 'eq', value: 'yes' }] },
      next: { yes: 'cake', else: 'who' },
    },
    {
      id: 'cake',
      type: 'image',
      data: {
        image: {
          icon: 'gift',
          accent: 'orange',
          title: 'On the house',
          subtitle: 'Dessert with a candle',
        },
        caption:
          'Happy {{occasion}}! We will bring a complimentary dessert with a candle and a little song.',
      },
      next: 'who',
    },
    {
      id: 'who',
      type: 'buttons',
      data: {
        text: 'Whose name should the table be under?',
        buttons: [
          {
            id: 'self',
            title: 'Mine',
            set: { diner: '{{user.fullName}}', dinerPhone: '{{user.phone}}' },
          },
          { id: 'other', title: 'Someone else' },
        ],
      },
      next: { self: 'own-phone', other: 'd-name' },
    },
    {
      id: 'own-phone',
      type: 'condition',
      data: { cases: [{ id: 'missing', var: 'dinerPhone', op: 'empty' }] },
      next: { missing: 'ask-phone', else: 'review' },
    },
    {
      id: 'ask-phone',
      type: 'input',
      data: {
        prompt: 'Which mobile number should we call if your table is ready early?',
        var: 'dinerPhone',
        kind: 'phone',
      },
      next: 'review',
    },
    {
      id: 'd-name',
      type: 'input',
      data: { prompt: 'Name for the reservation?', var: 'diner', kind: 'name' },
      next: 'd-phone',
    },
    {
      id: 'd-phone',
      type: 'input',
      data: { prompt: "{{diner}}'s mobile number?", var: 'dinerPhone', kind: 'phone' },
      next: 'review',
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check your reservation',
        text: '*Name:* {{diner}} ({{dinerPhone}})\n*Guests:* {{guests}}\n*When:* {{dayLabel}} at {{slot|time}}\n*Seating:* {{seating}}\n*Occasion:* {{occasion}}',
        footer: 'We hold tables for 15 minutes',
        buttons: [
          { id: 'confirm', title: 'Confirm' },
          { id: 'change', title: 'Change time' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'large', change: DAY, cancel: 'not-booked' },
    },
    {
      id: 'large',
      type: 'condition',
      data: {
        note: 'Parties of 7 or more pay a deposit, adjusted against the bill.',
        cases: [{ id: 'large', var: 'partySize', op: 'gt', value: String(LARGE_PARTY.from - 1) }],
      },
      next: { large: 'deposit', else: 'confirmed' },
    },
    {
      id: 'deposit',
      type: 'order',
      data: {
        set: { orderId: '$id:STP' },
        order: {
          orderId: '{{orderId}}',
          title: 'Large-party deposit',
          items: [
            {
              id: 'deposit',
              name: 'Table for {{guests}} — deposit',
              qty: 1,
              price: LARGE_PARTY.deposit,
            },
          ],
          status: 'pending',
          payTitle: 'Pay deposit',
        },
      },
      next: { pay: 'deposit-paid' },
    },
    {
      id: 'deposit-paid',
      type: 'order',
      data: {
        order: {
          orderId: '{{orderId}}',
          title: 'Deposit received',
          items: [
            {
              id: 'deposit',
              name: 'Table for {{guests}} — deposit',
              qty: 1,
              price: LARGE_PARTY.deposit,
            },
          ],
          status: 'paid',
        },
      },
      next: 'confirmed',
    },
    {
      id: 'confirmed',
      type: 'ticket',
      data: {
        complete: true,
        set: { bookingId: '$id:ST', table: '$int:4:28' },
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Table confirmed',
          subtitle: 'The Saffron Table, Hauz Khas Village',
          fields: [
            { label: 'Name', value: '{{diner}}' },
            { label: 'Guests', value: '{{guests}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Seating', value: '{{seating}}' },
            { label: 'Table', value: 'T-{{table}}' },
            { label: 'Occasion', value: '{{occasion}}' },
          ],
          qrData: 'saffrontable://table/{{bookingId}}?slot={{slot}}',
        },
        caption: 'Show this QR to the host when you arrive. We hold the table for 15 minutes.',
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Save it to your calendar, or call us if your plans change.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: 'Table at The Saffron Table',
              start: '{{slot}}',
              durationMin: 90,
              location: RESTAURANT.address,
            },
          },
          { kind: 'call', title: 'Call restaurant', phone: RESTAURANT.phone },
        ],
      },
      next: 'pin',
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
        caption: 'Paid parking at the village entrance; Green Park metro is 10 minutes by auto.',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: { afterMs: 20_000, label: 'Reservation reminder', note: 'Real use: 3 hours before.' },
      next: { next: 'preorder', later: 'r-msg' },
    },
    {
      id: 'preorder',
      type: 'buttons',
      data: {
        text: 'Skip the wait — pre-order a platter and it will be on the table when you sit down.',
        buttons: [
          { id: 'yes', title: 'Pre-order food' },
          { id: 'no', title: 'No, thanks' },
        ],
      },
      next: { yes: 'to-preorder', no: 'booked' },
    },
    { id: 'to-preorder', type: 'jump', data: { workflowKey: 'preorder' } },
    {
      id: 'booked',
      type: 'end',
      data: { text: 'See you on {{dayLabel}}, {{user.firstName}}!', showMenu: true },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'See you tonight',
        text: 'Hi {{user.firstName}}, your table for {{guests}} is at {{slot|time}} ({{seating}}). Booking {{bookingId}}.',
        buttons: [
          { id: 'coming', title: 'We’re coming' },
          { id: 'late', title: 'Running late' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { coming: 'r-ok', late: 'r-late', cancel: 'r-cancel' },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: { text: 'Lovely! Your table will be ready.', showMenu: true },
    },
    {
      id: 'r-late',
      type: 'end',
      data: {
        text: 'No problem — we will hold table T-{{table}} for an extra 20 minutes.',
        showMenu: true,
      },
    },
    {
      id: 'r-cancel',
      type: 'buttons',
      data: {
        text: 'Cancel your table for {{guests}} at {{slot|time}}? Any deposit is refunded in full.',
        buttons: [
          { id: 'yes', title: 'Yes, cancel' },
          { id: 'keep', title: 'Keep it' },
        ],
      },
      next: { yes: 'r-cancelled', keep: 'r-ok' },
    },
    {
      id: 'r-cancelled',
      type: 'end',
      data: {
        text: 'Cancelled. We hope to host you another time, {{user.firstName}}.',
        showMenu: true,
      },
    },
    {
      id: 'not-booked',
      type: 'end',
      data: {
        text: 'No reservation was made. Type *table* any time to start again.',
        showMenu: true,
      },
    },
    {
      id: EVENTS,
      type: 'handoff',
      data: {
        agentName: EVENTS_DESK.agentName,
        text: "Hi {{user.firstName}}, I'm Sana from events. For bigger groups we have a private dining room for up to 40 and set menus from ₹1,400 a head. Tell me the date, headcount and occasion and I will share options.",
      },
      next: 'events-cta',
    },
    {
      id: 'events-cta',
      type: 'cta',
      data: {
        text: 'Prefer to talk it through?',
        actions: [{ kind: 'call', title: 'Call Sana', phone: EVENTS_DESK.phone }],
      },
      next: 'events-end',
    },
    { id: 'events-end', type: 'end', data: { showMenu: true } },
    {
      id: 'host',
      type: 'handoff',
      data: {
        agentName: HOST.agentName,
        text: "Hi {{user.firstName}}, I'm Kunal, the floor manager. Tell me what you need — a high chair, wheelchair access, a surprise — and I will arrange it.",
      },
      next: 'host-end',
    },
    { id: 'host-end', type: 'end', data: { showMenu: true } },
  ],
});
