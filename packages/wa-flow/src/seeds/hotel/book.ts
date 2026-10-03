/**
 * Availability and booking: dates picked from a list or typed ("2 adults, check-in 12 Dec")
 * and read by an `ai` node → guests → room (skipped when chosen in "Rooms and rates") →
 * nights, priced per room → availability → guest details → special request → prepaid or
 * pay-at-hotel → voucher QR, confirmation PDF, map pin and a pre-arrival push.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import { rupees } from '../healthcare/data';
import { FRONT_DESK, GUEST_MIX, HOTEL, NIGHTS, ROOMS, roomSet, stayPrice, type Room } from './data';

const CHECKIN = 'checkin';
const AI_GUESTS = 'ai-guests';
const GUESTS = 'guests';
const HAS_ROOM = 'has-room';
const ROUTE = 'route';
const AVAIL = 'avail';
const VOUCHER = 'voucher';
const [FIRST_ROOM, ...OTHER_ROOMS] = ROOMS;

function nightsRow(room: Room, nights: number) {
  const price = stayPrice(room, nights);
  return {
    id: `n${nights}`,
    title: nights === 1 ? '1 night' : `${nights} nights`,
    description: `${rupees(price.roomTotal)} + GST · prepaid saves ${rupees(price.save)}`,
    set: {
      nights: String(nights),
      roomTotal: String(price.roomTotal),
      save: String(price.save),
      gst: String(price.gst),
      gstLabel: price.gstLabel,
    },
  };
}

/** One stay-length list per room, so each row carries that room's prices. */
function nightsList(room: Room): AuthorNode {
  return {
    id: `nights-${room.key}`,
    type: 'list',
    data: {
      text: '*{{room}}* from {{checkinLabel}} for {{guests}}. How many nights?',
      footer: 'Breakfast included · rates before GST',
      button: 'Nights',
      sections: [
        { id: 'stay', title: 'Length of stay', rows: NIGHTS.map((n) => nightsRow(room, n)) },
      ],
    },
    next: Object.fromEntries(NIGHTS.map((n) => [`n${n}`, AVAIL])),
  };
}

const ITEMS = [
  { id: 'room', name: '{{room}} × {{nights}} nights', qty: 1, price: '{{roomTotal}}' },
];
const ADJUSTMENTS = [
  { id: 'prepaid', label: 'Prepaid saving (10%)', amount: '-{{save}}' },
  { id: 'gst', label: '{{gstLabel}}', amount: '{{gst}}' },
];

export const book = defineWorkflow({
  key: 'book',
  name: 'Check availability',
  description: 'Pick dates, guests and room — book in a minute',
  keywords: ['book', 'availability', 'available', 'check in date', 'stay', 'booking', 'nights'],
  nodes: [
    {
      id: 'how',
      type: 'buttons',
      data: {
        header: 'Check availability',
        text: 'Lovely, {{user.firstName}}! Choose your dates step by step, or type it in one line like "2 adults, check-in 12 December".',
        buttons: [
          { id: 'steps', title: 'Pick dates', set: { checkinMs: '', adults: '' } },
          { id: 'type', title: 'Type it' },
        ],
      },
      next: { steps: CHECKIN, type: 'ai' },
    },
    {
      id: 'ai',
      type: 'ai',
      data: {
        set: { checkinMs: '', adults: '' },
        prompt: 'Go ahead — when do you arrive, and how many of you?',
        intents: [
          { id: 'book', description: 'Wants to stay: dates, nights or number of guests' },
          { id: 'group', description: 'A wedding, group or corporate booking of 5 or more rooms' },
          { id: 'human', description: 'Wants to talk to a person' },
        ],
        entities: [
          { name: 'checkin', kind: 'date', description: 'Check-in date' },
          { name: 'adults', kind: 'number', description: 'Number of adults' },
        ],
        retry: 'Sorry, I could not read the dates. Let us pick them instead.',
      },
      next: { book: 'ai-date', group: 'group', human: 'desk', fallback: CHECKIN },
    },
    {
      id: 'ai-date',
      type: 'condition',
      data: {
        note: 'checkinMs is set by the AI reader when it resolved a date.',
        cases: [{ id: 'known', var: 'checkinMs', op: 'notEmpty' }],
      },
      next: { known: 'ai-date-set', else: CHECKIN },
    },
    {
      id: 'ai-date-set',
      type: 'delay',
      data: { ms: 300, set: { checkin: '{{checkinMs}}', checkinLabel: '{{checkinMs|day}}' } },
      next: AI_GUESTS,
    },
    {
      id: CHECKIN,
      type: 'list',
      data: {
        text: 'When would you like to check in? Check-in is from 2 pm.',
        button: 'Check-in date',
        sections: [],
        dynamic: { kind: 'days', count: 10, var: 'checkin' },
      },
      next: { pick: AI_GUESTS },
    },
    {
      id: AI_GUESTS,
      type: 'condition',
      data: { cases: [{ id: 'known', var: 'adults', op: 'notEmpty' }] },
      next: { known: 'ai-guests-set', else: GUESTS },
    },
    {
      id: 'ai-guests-set',
      type: 'delay',
      data: { ms: 300, set: { guests: '{{adults}} adults' } },
      next: HAS_ROOM,
    },
    {
      id: GUESTS,
      type: 'list',
      data: {
        text: 'Check-in {{checkinLabel}}. Who is travelling?',
        footer: 'Children under 6 stay free',
        button: 'Guests',
        sections: [
          {
            id: 'mix',
            title: 'Guests',
            rows: GUEST_MIX.map((g) => ({ id: g.id, title: g.title, set: { guests: g.guests } })),
          },
        ],
      },
      next: Object.fromEntries(GUEST_MIX.map((g) => [g.id, HAS_ROOM])),
    },
    {
      id: HAS_ROOM,
      type: 'condition',
      data: {
        note: 'A room chosen in "Rooms and rates" is kept.',
        cases: [{ id: 'none', var: 'roomKey', op: 'empty' }],
      },
      next: { none: 'room', else: ROUTE },
    },
    {
      id: 'room',
      type: 'list',
      data: {
        text: 'Which room would you like?',
        button: 'Rooms',
        sections: [
          {
            id: 'rooms',
            title: 'Rooms and villas',
            rows: ROOMS.map((r) => ({
              id: r.key,
              title: r.name,
              description: `${r.summary} · ${rupees(r.rate)}/night`,
              set: roomSet(r),
            })),
          },
        ],
      },
      next: Object.fromEntries(ROOMS.map((r) => [r.key, ROUTE])),
    },
    {
      id: ROUTE,
      type: 'condition',
      data: {
        note: 'One case per room; the first room is the fallback.',
        cases: OTHER_ROOMS.map((r) => ({
          id: r.key,
          var: 'roomKey',
          op: 'eq' as const,
          value: r.key,
        })),
      },
      next: {
        ...Object.fromEntries(OTHER_ROOMS.map((r) => [r.key, `nights-${r.key}`])),
        else: `nights-${FIRST_ROOM.key}`,
      },
    },
    ...ROOMS.map(nightsList),
    {
      id: AVAIL,
      type: 'text',
      data: {
        set: { roomsLeft: '$int:2:5' },
        text: 'Good news — {{roomsLeft}} {{room}} rooms are free from {{checkinLabel}} for {{nights}} nights. Let me hold one for you.',
      },
      next: 'who',
    },
    {
      id: 'who',
      type: 'buttons',
      data: {
        text: 'Whose name should the booking be in?',
        buttons: [
          {
            id: 'self',
            title: 'Mine',
            set: { guestName: '{{user.fullName}}', guestPhone: '{{user.phone}}' },
          },
          { id: 'other', title: 'Someone else' },
        ],
      },
      next: { self: 'own-phone', other: 'g-name' },
    },
    {
      id: 'own-phone',
      type: 'condition',
      data: { cases: [{ id: 'missing', var: 'guestPhone', op: 'empty' }] },
      next: { missing: 'ask-phone', else: 'request' },
    },
    {
      id: 'ask-phone',
      type: 'input',
      data: {
        prompt: 'Which mobile number should we send the voucher to?',
        var: 'guestPhone',
        kind: 'phone',
      },
      next: 'request',
    },
    {
      id: 'g-name',
      type: 'input',
      data: { prompt: "Lead guest's full name, as on their ID?", var: 'guestName', kind: 'name' },
      next: 'g-phone',
    },
    {
      id: 'g-phone',
      type: 'input',
      data: { prompt: "{{guestName}}'s mobile number?", var: 'guestPhone', kind: 'phone' },
      next: 'request',
    },
    {
      id: 'request',
      type: 'list',
      data: {
        text: 'Any special requests? We will do our best.',
        button: 'Requests',
        sections: [
          {
            id: 'requests',
            title: 'Requests',
            rows: [
              {
                id: 'pickup',
                title: 'Airport pickup',
                description: 'From ₹1,800, arranged on WhatsApp',
                set: { request: 'Airport pickup' },
              },
              {
                id: 'early',
                title: 'Early check-in',
                description: 'Subject to availability',
                set: { request: 'Early check-in' },
              },
              {
                id: 'decor',
                title: 'Honeymoon décor',
                description: 'Flowers, cake and a candle-lit turndown',
                set: { request: 'Honeymoon décor' },
              },
              {
                id: 'cot',
                title: 'Baby cot',
                description: 'Free on request',
                set: { request: 'Baby cot' },
              },
              { id: 'none', title: 'No requests', set: { request: 'None' } },
            ],
          },
        ],
      },
      next: { pickup: 'review', early: 'review', decor: 'review', cot: 'review', none: 'review' },
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check your booking',
        text: '*Guest:* {{guestName}} ({{guestPhone}})\n*Room:* {{room}} · {{guests}}\n*Check-in:* {{checkinLabel}}, from 2 pm\n*Nights:* {{nights}}\n*Request:* {{request}}\n*Room charges:* {{roomTotal|money}} + GST\nPay now and save {{save|money}}, or pay at checkout.',
        footer: 'Free cancellation up to 72 hours before',
        buttons: [
          { id: 'prepay', title: 'Pay now, save 10%', set: { payMode: 'Prepaid' } },
          { id: 'later', title: 'Pay at hotel', set: { payMode: 'Pay at hotel' } },
          { id: 'change', title: 'Change dates' },
        ],
      },
      next: { prepay: 'secure', later: 'hold', change: CHECKIN },
    },
    {
      id: 'secure',
      type: 'notice',
      data: {
        text: 'Payments are processed by our payment partner. We never ask for your card PIN or OTP in this chat.',
      },
      next: 'summary',
    },
    {
      id: 'summary',
      type: 'order',
      data: {
        set: { orderId: '$id:CBP' },
        order: {
          orderId: '{{orderId}}',
          title: 'Your stay',
          items: ITEMS,
          adjustments: ADJUSTMENTS,
          status: 'pending',
          payTitle: 'Pay now',
        },
      },
      next: { pay: 'paid' },
    },
    {
      id: 'paid',
      type: 'order',
      data: {
        order: {
          orderId: '{{orderId}}',
          title: 'Payment received',
          items: ITEMS,
          adjustments: ADJUSTMENTS,
          status: 'paid',
        },
      },
      next: VOUCHER,
    },
    {
      id: 'hold',
      type: 'notice',
      data: { text: 'No payment now. Your room is held; pay at checkout by card, UPI or cash.' },
      next: VOUCHER,
    },
    {
      id: VOUCHER,
      type: 'ticket',
      data: {
        complete: true,
        set: { bookingId: '$id:CB' },
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Booking confirmed',
          subtitle: 'Coral Bay Resort, Candolim',
          fields: [
            { label: 'Guest', value: '{{guestName}}' },
            { label: 'Room', value: '{{room}}' },
            { label: 'Guests', value: '{{guests}}' },
            { label: 'Check-in', value: '{{checkinLabel}}, 2 pm' },
            { label: 'Nights', value: '{{nights}}' },
            { label: 'Payment', value: '{{payMode}}' },
            { label: 'Request', value: '{{request}}' },
          ],
          qrData: 'coralbay://stay/{{bookingId}}?checkin={{checkin}}',
        },
        caption: 'Show this QR at reception for a 2-minute check-in.',
      },
      next: 'confirmation',
    },
    {
      id: 'confirmation',
      type: 'document',
      data: {
        document: {
          fileName: 'CoralBay_Booking_Confirmation.pdf',
          fileType: 'PDF',
          pages: 2,
          sizeKb: 164,
          preview: {
            title: 'Booking confirmation',
            subtitle: 'Coral Bay Resort, Candolim, Goa',
            sections: [
              {
                kind: 'fields',
                heading: 'Reservation',
                fields: [
                  { label: 'Booking', value: '{{bookingId}}' },
                  { label: 'Guest', value: '{{guestName}}' },
                  { label: 'Room', value: '{{room}}' },
                  { label: 'Guests', value: '{{guests}}' },
                  { label: 'Check-in', value: '{{checkinLabel}}, from 2 pm' },
                  { label: 'Nights', value: '{{nights}}' },
                  { label: 'Payment', value: '{{payMode}}' },
                ],
              },
              {
                kind: 'text',
                heading: 'Good to know',
                text: 'Breakfast 7–10:30 am at The Shack. Checkout 11 am. Please carry a government photo ID for every adult; foreign nationals need a passport and visa. Free cancellation up to 72 hours before check-in.',
              },
            ],
            footer: 'Coral Bay Resort · Fort Aguada Road, Candolim, Goa 403515',
          },
        },
        caption: 'Your booking confirmation, {{user.firstName}}.',
      },
      next: 'pin',
    },
    {
      id: 'pin',
      type: 'location',
      data: {
        location: { name: HOTEL.name, address: HOTEL.address, lat: HOTEL.lat, lng: HOTEL.lng },
        caption: '5 minutes from Candolim beach road. Free valet parking.',
      },
      next: 'cta',
    },
    {
      id: 'cta',
      type: 'cta',
      data: {
        text: 'Save time at arrival — finish web check-in any time before your stay.',
        actions: [
          { kind: 'url', title: 'Web check-in', url: HOTEL.webCheckIn },
          { kind: 'call', title: 'Call the resort', phone: HOTEL.phone },
        ],
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Your stay is tomorrow',
        note: 'Real use: the day before check-in.',
      },
      next: { next: 'booked', later: 'pre-arrival' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'Can’t wait to host you, {{user.firstName}}! We will message you the day before.',
        showMenu: true,
      },
    },
    {
      id: 'pre-arrival',
      type: 'buttons',
      data: {
        header: 'See you tomorrow',
        text: 'Hi {{user.firstName}}, your {{room}} is ready for check-in on {{checkinLabel}}. Booking {{bookingId}}.\nNeed a ride from the airport, or want to finish check-in now?',
        buttons: [
          { id: 'checkin', title: 'Check-in and pickup' },
          { id: 'fine', title: 'All good' },
        ],
      },
      next: { checkin: 'to-check-in', fine: 'fine' },
    },
    { id: 'to-check-in', type: 'jump', data: { workflowKey: 'check-in' } },
    {
      id: 'fine',
      type: 'end',
      data: { text: 'Safe travels! Our team will be waiting.', showMenu: true },
    },
    {
      id: 'group',
      type: 'handoff',
      data: {
        agentName: 'Ashwin (Weddings and groups)',
        text: "Hi {{user.firstName}}, I'm Ashwin from our groups team. For 5 or more rooms we offer group rates, a dedicated host and event lawns for up to 300 guests. Share your dates and headcount and I'll send a proposal.",
      },
      next: 'group-end',
    },
    { id: 'group-end', type: 'end', data: { showMenu: true } },
    {
      id: 'desk',
      type: 'handoff',
      data: {
        agentName: FRONT_DESK.agentName,
        text: "Hi {{user.firstName}}, Elton from the front desk. Tell me your dates and I'll find the best room for you.",
      },
      next: 'desk-end',
    },
    { id: 'desk-end', type: 'end', data: { showMenu: true } },
  ],
});
