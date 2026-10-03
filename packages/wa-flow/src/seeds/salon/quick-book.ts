/**
 * Book by message: the customer types what they want in their own words ("haircut kal shaam
 * 5 baje"). An `ai` node reads the intent, the service and the time; a missing time falls back
 * to the day and slot pickers, and text it cannot read falls back to buttons.
 */
import { defineWorkflow } from '../../author';
import { FRONT_DESK, PRICE_GUIDE, SALON } from './data';
import { rupees } from '../healthcare/data';

const CONFIRM = 'q-confirm';
const DAY = 'q-day';

export const quickBook = defineWorkflow({
  key: 'quick-book',
  name: 'Book by message',
  description: 'Just type what you want and when, in your own words',
  keywords: ['kal', 'today', 'tomorrow', 'aaj', 'shaam', 'baje', 'price', 'how much', 'rate'],
  nodes: [
    {
      id: 'ask',
      type: 'ai',
      data: {
        prompt:
          'Tell me what you would like and when, {{user.firstName}} — e.g. "haircut and beard trim kal shaam 5 baje" or "facial on Saturday morning". You can also ask about prices or offers.',
        intents: [
          { id: 'book', description: 'Wants to book a salon or spa service' },
          { id: 'price', description: 'Asks what a service costs' },
          { id: 'offers', description: 'Asks about offers, discounts, packages or memberships' },
          { id: 'human', description: 'Wants to talk to a person, or has a complaint' },
        ],
        entities: [
          {
            name: 'service',
            kind: 'text',
            description: 'The service(s) asked for, e.g. "haircut and beard trim"',
          },
          { name: 'when', kind: 'datetime', description: 'When they want to come in' },
          { name: 'people', kind: 'number', description: 'How many people, if more than one' },
        ],
        retry: 'Sorry, I could not quite follow that.',
      },
      next: {
        book: 'has-service',
        price: 'prices',
        offers: 'to-packages',
        human: 'desk',
        fallback: 'help',
      },
    },
    {
      id: 'has-service',
      type: 'condition',
      data: {
        note: 'No service named? Use the full menu instead.',
        cases: [{ id: 'none', var: 'service', op: 'empty' }],
      },
      next: { none: 'to-book', else: 'has-time' },
    },
    {
      id: 'has-time',
      type: 'condition',
      data: {
        note: 'whenMs is set by the AI reader when it resolved a date and time.',
        cases: [{ id: 'time', var: 'whenMs', op: 'notEmpty' }],
      },
      next: { time: 'q-time', else: DAY },
    },
    {
      id: 'q-time',
      type: 'text',
      data: {
        set: { slot: '{{whenMs}}', dayLabel: '{{whenMs|day}}' },
        text: 'Got it — *{{service}}* on {{dayLabel}} at {{slot|time}}. Let me check the book…',
      },
      next: CONFIRM,
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Sure, *{{service}}*. Which day suits you?',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, var: 'day' },
      },
      next: { pick: 'q-slot' },
    },
    {
      id: 'q-slot',
      type: 'list',
      data: {
        text: 'Free slots on {{dayLabel}} (IST):',
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
          from: 10,
          to: 21,
          stepMin: 30,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: CONFIRM, 'other-day': DAY },
    },
    {
      id: CONFIRM,
      type: 'buttons',
      data: {
        set: { stylist: '$pick:Imran Qureshi|Kabir Malhotra|Zoya Fernandes|Aarav Shah' },
        header: 'Slot available',
        text: '{{stylist}} is free on {{dayLabel}} at {{slot|time}} for *{{service}}*.\nBook it for {{user.fullName}}? You pay at the salon.',
        footer: 'Free rescheduling up to 3 hours before',
        buttons: [
          { id: 'yes', title: 'Book it' },
          { id: 'other', title: 'Another time' },
          { id: 'menu', title: 'See full menu' },
        ],
      },
      next: { yes: 'q-ticket', other: DAY, menu: 'to-book' },
    },
    {
      id: 'q-ticket',
      type: 'ticket',
      data: {
        complete: true,
        set: { bookingId: '$id:GC' },
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Appointment confirmed',
          subtitle: 'Glow & Co., Bandra West',
          fields: [
            { label: 'Guest', value: '{{user.fullName}}' },
            { label: 'Service', value: '{{service}}' },
            { label: 'Stylist', value: '{{stylist}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Payment', value: 'At the salon' },
          ],
          qrData: 'glowandco://visit/{{bookingId}}?slot={{slot}}',
        },
        caption: 'Show this QR at reception. We will remind you on the day.',
      },
      next: 'q-remind',
    },
    {
      id: 'q-remind',
      type: 'reminder',
      data: { afterMs: 15_000, label: 'Appointment reminder', note: 'Real use: 3 hours before.' },
      next: { next: 'q-done', later: 'q-push' },
    },
    {
      id: 'q-done',
      type: 'end',
      data: { text: 'All booked, {{user.firstName}}. See you soon!', showMenu: true },
    },
    {
      id: 'q-push',
      type: 'cta',
      data: {
        header: 'See you today',
        text: 'Hi {{user.firstName}}, your *{{service}}* with {{stylist}} is at {{slot|time}} today. Running late? Just call us and we will hold your chair.',
        actions: [
          { kind: 'url', title: 'Get directions', url: SALON.directions },
          { kind: 'call', title: 'Call the salon', phone: SALON.phone },
        ],
      },
      next: 'q-push-end',
    },
    { id: 'q-push-end', type: 'end', data: { showMenu: true } },
    {
      id: 'prices',
      type: 'list',
      data: {
        header: 'Price guide',
        text: 'Here is where each menu starts. Pick one to see every service and book.',
        footer: 'Prices include GST',
        button: 'See prices',
        sections: [
          {
            id: 'from',
            title: 'Starting prices',
            rows: PRICE_GUIDE.map((p) => ({
              id: p.id,
              title: p.name,
              description: `From ${rupees(p.from)}`,
            })),
          },
        ],
      },
      next: Object.fromEntries(PRICE_GUIDE.map((p) => [p.id, 'to-book'])),
    },
    { id: 'to-book', type: 'jump', data: { workflowKey: 'book' } },
    { id: 'to-packages', type: 'jump', data: { workflowKey: 'packages' } },
    {
      id: 'help',
      type: 'buttons',
      data: {
        text: 'You can pick from our menu, or a stylist can help you choose.',
        buttons: [
          { id: 'book', title: 'Browse services' },
          { id: 'retry', title: 'Type it again' },
          { id: 'desk', title: 'Talk to us' },
        ],
      },
      next: { book: 'to-book', retry: 'ask', desk: 'desk' },
    },
    {
      id: 'desk',
      type: 'handoff',
      data: {
        agentName: FRONT_DESK.agentName,
        text: "Hi {{user.firstName}}, I'm Riya from the front desk. Tell me what you have in mind and I will find the right stylist and slot for you.",
      },
      next: 'desk-card',
    },
    {
      id: 'desk-card',
      type: 'contact',
      data: {
        contact: {
          name: FRONT_DESK.name,
          phone: FRONT_DESK.phone,
          role: FRONT_DESK.role,
          organisation: 'Glow & Co. Salon and Spa',
        },
      },
      next: 'desk-end',
    },
    { id: 'desk-end', type: 'end', data: { showMenu: true } },
  ],
});
