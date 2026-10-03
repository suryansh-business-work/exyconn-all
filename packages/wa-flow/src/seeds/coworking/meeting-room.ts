/**
 * Meeting room booking: centre → when, how long and how many, typed naturally ("kal 3 baje 2
 * ghante, 6 log", read by an `ai` node) or picked from day/slot lists → duration → room
 * carousel priced for that duration → order with GST → pay → access pass → a "room is ready"
 * push to extend by 30 minutes (another order), confirm, or call the community team.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import type { Product } from '../../schema';
import { BRAND, CENTRES, COMMUNITY, DURATIONS, ROOMS, centreSections, gst, rupees } from './data';

const DAY = 'day';
const DURATION = 'duration';
const DUR_ROUTE = 'dur-route';
const ORDER = 'order';

function roomCard(room: (typeof ROOMS)[number], hours: number): Product {
  const total = room.rate * hours;
  const extension = room.rate / 2;
  return {
    id: room.id,
    title: room.name,
    subtitle: `${room.seats} seats · ${room.kit}`,
    price: total,
    badge: `${rupees(room.rate)}/hr`,
    image: { icon: room.icon, accent: 'amber', title: room.name, subtitle: `${room.seats} seats` },
    buttonTitle: 'Book room',
    set: {
      room: room.name,
      roomSeats: String(room.seats),
      roomTotal: String(total),
      roomGst: String(gst(total)),
      extPrice: String(extension),
      extGst: String(gst(extension)),
    },
  };
}

/** One carousel per duration, with totals for that many hours. */
function roomCarousel(duration: (typeof DURATIONS)[number]): AuthorNode {
  return {
    id: `rooms-${duration.id}`,
    type: 'carousel',
    data: {
      text: 'Rooms free at {{centre}} on {{dayLabel}} from {{slot|time}} for *{{hoursLabel}}*. Prices are for the full booking, before GST.',
      set: { hoursLabel: duration.title },
      cards: ROOMS.map((room) => roomCard(room, duration.hours)),
    },
    next: Object.fromEntries(ROOMS.map((r) => [r.id, ORDER])),
  };
}

export const meetingRoom = defineWorkflow({
  key: 'meeting-room',
  name: 'Book a meeting room',
  description: 'Rooms for 4 to 30 people, by the hour',
  keywords: ['meeting room', 'conference room', 'boardroom', 'book a room', 'room'],
  nodes: [
    {
      id: 'centre',
      type: 'list',
      data: {
        header: 'Book a meeting room',
        text: 'Hi {{user.firstName}}, rooms are open to members and guests, with screens, video bars and free coffee. Which centre?',
        button: 'Choose centre',
        sections: centreSections(),
      },
      next: Object.fromEntries(CENTRES.map((c) => [c.id, 'when'])),
    },
    {
      id: 'when',
      type: 'ai',
      data: {
        set: { whenMs: '', hours: '', people: '' },
        prompt:
          'When do you need it, for how long and for how many people? Type it naturally — "kal 3 baje 2 ghante, 6 log" or "Friday 11 am for an hour" — or type *show slots*.',
        intents: [
          { id: 'book', description: 'Gives a day or time for the booking, maybe a duration' },
          { id: 'browse', description: 'Wants to see free slots or rooms first' },
        ],
        entities: [
          { name: 'when', kind: 'datetime', description: 'Start date and time of the meeting' },
          { name: 'hours', kind: 'number', description: 'Length in hours; half day is 4' },
          { name: 'people', kind: 'number', description: 'How many people will attend' },
        ],
        retry: "Sorry, I couldn't read a time from that. Here are the free slots.",
      },
      next: { book: 'has-time', browse: DAY, fallback: DAY },
    },
    {
      id: 'has-time',
      type: 'condition',
      data: { cases: [{ id: 'missing', var: 'whenMs', op: 'empty' }] },
      next: { missing: DAY, else: 'ai-confirm' },
    },
    {
      id: 'ai-confirm',
      type: 'buttons',
      data: {
        text: 'Book a room at {{centre}} from *{{whenMs|day}}, {{whenMs|time}}*?',
        buttons: [
          { id: 'yes', title: 'Yes', set: { slot: '{{whenMs}}', dayLabel: '{{whenMs|day}}' } },
          { id: 'other', title: 'See free slots' },
        ],
      },
      next: { yes: DUR_ROUTE, other: DAY },
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day do you need the room?',
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
        text: 'Start times with rooms free on {{dayLabel}}:',
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
          from: 9,
          to: 20,
          stepMin: 30,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: DUR_ROUTE, 'other-day': DAY },
    },
    {
      id: DUR_ROUTE,
      type: 'condition',
      data: {
        note: 'A duration the AI read (1, 2 or 4 hours) skips the question.',
        cases: DURATIONS.map((d) => ({ id: d.id, var: 'hours', op: 'eq' as const, value: d.id })),
      },
      next: {
        ...Object.fromEntries(DURATIONS.map((d) => [d.id, `rooms-${d.id}`])),
        else: DURATION,
      },
    },
    {
      id: DURATION,
      type: 'buttons',
      data: {
        text: 'For how long?',
        buttons: DURATIONS.map((d) => ({ id: d.id, title: d.title, set: { hours: d.id } })),
      },
      next: Object.fromEntries(DURATIONS.map((d) => [d.id, DUR_ROUTE])),
    },
    ...DURATIONS.map(roomCarousel),
    {
      id: ORDER,
      type: 'order',
      data: {
        set: { orderId: '$id:MR' },
        order: {
          orderId: '{{orderId}}',
          title: 'Meeting room booking',
          items: [
            { id: 'room', name: '{{room}} · {{hoursLabel}}', qty: 1, price: '{{roomTotal}}' },
          ],
          adjustments: [{ id: 'gst', label: 'GST (18%)', amount: '{{roomGst}}' }],
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
          items: [
            { id: 'room', name: '{{room}} · {{hoursLabel}}', qty: 1, price: '{{roomTotal}}' },
          ],
          adjustments: [{ id: 'gst', label: 'GST (18%)', amount: '{{roomGst}}' }],
          status: 'paid',
        },
      },
      next: 'access',
    },
    {
      id: 'access',
      type: 'ticket',
      data: {
        complete: true,
        set: { bookingId: '$id:RM', wifiCode: '$int:1000:9999' },
        ticket: {
          ticketId: '{{bookingId}}',
          title: '{{room}} booked',
          subtitle: '{{centre}}',
          fields: [
            { label: 'Booked by', value: '{{user.fullName}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'From', value: '{{slot|time}}' },
            { label: 'Duration', value: '{{hoursLabel}}' },
            { label: 'Seats', value: '{{roomSeats}}' },
            { label: 'Wi-Fi', value: 'Loftline-Meet · {{wifiCode}}' },
          ],
          qrData: 'https://loftline.example/door/{{bookingId}}',
        },
        caption: 'This QR opens the room door. Guests can check in at reception with your name.',
      },
      next: 'help',
    },
    {
      id: 'help',
      type: 'cta',
      data: {
        text: 'Need a projector, catering or a guest list at reception? Call the community team.',
        actions: [
          { kind: 'call', title: 'Call community', phone: COMMUNITY.phone },
          { kind: 'url', title: 'House rules', url: BRAND.rules },
        ],
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: { afterMs: 20_000, label: 'Your room is ready', note: 'Real use: 10 minutes before.' },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: { text: 'All set, {{user.firstName}}. Have a great meeting!', showMenu: true },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Room ready',
        text: 'The {{room}} at {{centre}} is ready for you — screen on, coffee on the way.',
        buttons: [
          { id: 'extend', title: 'Extend 30 min' },
          { id: 'ok', title: 'All good' },
          { id: 'help', title: 'Need help' },
        ],
      },
      next: { extend: 'ext-order', ok: 'r-ok', help: 'r-help' },
    },
    {
      id: 'ext-order',
      type: 'order',
      data: {
        set: { extId: '$id:MR' },
        order: {
          orderId: '{{extId}}',
          title: 'Extend booking',
          items: [{ id: 'ext', name: '{{room}} · 30 minutes more', qty: 1, price: '{{extPrice}}' }],
          adjustments: [{ id: 'gst', label: 'GST (18%)', amount: '{{extGst}}' }],
          status: 'pending',
          payTitle: 'Pay & extend',
        },
      },
      next: { pay: 'ext-done' },
    },
    {
      id: 'ext-done',
      type: 'end',
      data: {
        text: 'Extended by 30 minutes. Payment {{extId}} received — enjoy the extra time.',
        showMenu: true,
      },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: { text: 'Have a productive meeting!', showMenu: true },
    },
    {
      id: 'r-help',
      type: 'handoff',
      data: {
        agentName: COMMUNITY.agentName,
        text: "Hi {{user.firstName}}, I'm Ritika from the community team at {{centre}}. What do you need for the {{room}}?",
      },
      next: 'r-help-end',
    },
    {
      id: 'r-help-end',
      type: 'end',
      data: { showMenu: true },
    },
  ],
});
