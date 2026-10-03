/**
 * Salon booking: category → service → stylist → day → slot → add-on upsell → guest (the
 * signed-in user or a friend) → review → deposit → QR ticket, calendar, map pin and a
 * reminder push that can confirm, reschedule or cancel.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import { rupees } from '../healthcare/data';
import {
  CATEGORIES,
  SALON,
  STYLISTS,
  type Service,
  type ServiceCategory,
  type Stylist,
} from './data';

const STYLIST = 'stylist';
const [FIRST, ...OTHERS] = CATEGORIES;

function categoryRow(category: ServiceCategory) {
  return {
    id: category.key,
    title: category.name,
    description: category.description,
    set: {
      category: category.name,
      categoryKey: category.key,
      deposit: String(category.deposit),
      upsell: category.upsell.name,
      upsellPrice: String(category.upsell.price),
      upsellMrp: String(category.upsell.mrp),
    },
  };
}

function serviceRow(service: Service) {
  return {
    id: service.id,
    title: service.name,
    description: `${service.description} · ${service.durationMin} min · ${rupees(service.price)}`,
    set: {
      service: service.name,
      servicePrice: String(service.price),
      duration: String(service.durationMin),
    },
  };
}

function stylistRow(stylist: Stylist) {
  const premium = stylist.premium > 0 ? ` · +${rupees(stylist.premium)}` : '';
  return {
    id: stylist.id,
    title: stylist.name,
    description: `${stylist.speciality} · ${stylist.years} yrs${premium}`,
    set: { stylist: stylist.name, stylistFee: String(stylist.premium) },
  };
}

/** One service menu per category; every service leads to the stylist list. */
function serviceList(category: ServiceCategory): AuthorNode {
  return {
    id: `svc-${category.key}`,
    type: 'list',
    data: {
      header: category.name,
      text: '*{{category}}* — pick a service. Prices are for a single guest and include GST.',
      footer: 'Final price may vary with hair length',
      button: 'Choose service',
      sections: [{ id: 'services', title: 'Services', rows: category.services.map(serviceRow) }],
    },
    next: Object.fromEntries(category.services.map((s) => [s.id, STYLIST])),
  };
}

export const book = defineWorkflow({
  key: 'book',
  name: 'Book an appointment',
  description: 'Hair, skin, nails, spa and grooming with your stylist',
  keywords: [
    'book',
    'book appointment',
    'haircut',
    'facial',
    'massage',
    'manicure',
    'pedicure',
    'slot',
  ],
  nodes: [
    {
      id: 'category',
      type: 'list',
      data: {
        header: 'Book an appointment',
        text: 'Lovely, {{user.firstName}}! What would you like to book?',
        footer: 'Open all days, 10 am – 9 pm',
        button: 'Categories',
        sections: [{ id: 'menu', title: 'Our menu', rows: CATEGORIES.map(categoryRow) }],
      },
      next: Object.fromEntries(CATEGORIES.map((c) => [c.key, 'route'])),
    },
    {
      id: 'route',
      type: 'condition',
      data: {
        note: 'One case per category; the first category is the fallback.',
        cases: OTHERS.map((c) => ({
          id: c.key,
          var: 'categoryKey',
          op: 'eq' as const,
          value: c.key,
        })),
      },
      next: {
        ...Object.fromEntries(OTHERS.map((c) => [c.key, `svc-${c.key}`])),
        else: `svc-${FIRST.key}`,
      },
    },
    ...CATEGORIES.map(serviceList),
    {
      id: STYLIST,
      type: 'list',
      data: {
        text: '*{{service}}* · {{duration}} min · {{servicePrice|money}}\nWho would you like? Senior stylists carry a small premium.',
        button: 'Choose stylist',
        sections: [
          {
            id: 'any',
            title: 'Quickest',
            rows: [
              {
                id: 'any',
                title: 'Any available stylist',
                description: 'We pick the best free expert for your slot',
                set: {
                  stylist: '$pick:Imran Qureshi|Kabir Malhotra|Tanya D’Souza',
                  stylistFee: '0',
                },
              },
            ],
          },
          { id: 'team', title: 'Our team', rows: STYLISTS.map(stylistRow) },
        ],
      },
      next: { any: 'day', ...Object.fromEntries(STYLISTS.map((s) => [s.id, 'day'])) },
    },
    {
      id: 'day',
      type: 'list',
      data: {
        text: 'Which day suits you for {{service}} with {{stylist}}?',
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
        text: 'Free slots with {{stylist}} on {{dayLabel}} (IST):',
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
      next: { pick: 'upsell', 'other-day': 'day' },
    },
    {
      id: 'upsell',
      type: 'product',
      data: {
        product: {
          id: 'add-on',
          title: '{{upsell}}',
          subtitle: 'Add-on for today only · takes 15 extra minutes',
          price: '{{upsellPrice}}',
          mrp: '{{upsellMrp}}',
          badge: 'Guest favourite',
          image: { icon: 'gift', accent: 'pink', title: 'Add-on offer' },
        },
      },
      next: 'upsell-ask',
    },
    {
      id: 'upsell-ask',
      type: 'buttons',
      data: {
        text: 'Most guests pair {{service}} with *{{upsell}}*. Add it to your visit?',
        buttons: [
          {
            id: 'add',
            title: 'Yes, add it',
            set: { addOn: '{{upsell}}', addOnPrice: '{{upsellPrice}}' },
          },
          { id: 'skip', title: 'No, thanks', set: { addOn: 'None', addOnPrice: '0' } },
          { id: 'packages', title: 'See packages' },
        ],
      },
      next: { add: 'who', skip: 'who', packages: 'to-packages' },
    },
    { id: 'to-packages', type: 'jump', data: { workflowKey: 'packages' } },
    {
      id: 'who',
      type: 'buttons',
      data: {
        text: 'Who is the appointment for? Book for yourself ({{user.fullName}}) or for a friend.',
        buttons: [
          {
            id: 'self',
            title: 'Myself',
            set: { guestName: '{{user.fullName}}', guestPhone: '{{user.phone}}' },
          },
          { id: 'friend', title: 'A friend' },
        ],
      },
      next: { self: 'own-phone', friend: 'g-name' },
    },
    {
      id: 'own-phone',
      type: 'condition',
      data: {
        note: 'The signed-in profile may have no phone; ask for one then.',
        cases: [{ id: 'missing', var: 'guestPhone', op: 'empty' }],
      },
      next: { missing: 'ask-phone', else: 'review' },
    },
    {
      id: 'ask-phone',
      type: 'input',
      data: {
        prompt: 'Which mobile number should we send the booking updates to?',
        var: 'guestPhone',
        kind: 'phone',
      },
      next: 'review',
    },
    {
      id: 'g-name',
      type: 'input',
      data: { prompt: "Your friend's full name?", var: 'guestName', kind: 'name' },
      next: 'g-phone',
    },
    {
      id: 'g-phone',
      type: 'input',
      data: {
        prompt: "{{guestName}}'s mobile number? We will text the booking to them too.",
        var: 'guestPhone',
        kind: 'phone',
      },
      next: 'review',
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check your booking',
        text: '*Guest:* {{guestName}} ({{guestPhone}})\n*Service:* {{service}} · {{servicePrice|money}}\n*Stylist:* {{stylist}} · +{{stylistFee|money}}\n*Add-on:* {{addOn}} · {{addOnPrice|money}}\n*When:* {{dayLabel}} at {{slot|time}}\n\nPay a {{deposit|money}} deposit now; it comes off your final bill.',
        footer: 'Free rescheduling up to 3 hours before',
        buttons: [
          { id: 'confirm', title: 'Pay deposit' },
          { id: 'change', title: 'Change time' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'secure', change: 'day', cancel: 'not-booked' },
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
        set: { orderId: '$id:GCP' },
        order: {
          orderId: '{{orderId}}',
          title: 'Booking deposit',
          items: [{ id: 'deposit', name: 'Deposit — {{service}}', qty: 1, price: '{{deposit}}' }],
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
        set: { bookingId: '$id:GC', chair: '$int:2:12' },
        order: {
          orderId: '{{orderId}}',
          title: 'Deposit received',
          items: [{ id: 'deposit', name: 'Deposit — {{service}}', qty: 1, price: '{{deposit}}' }],
          status: 'paid',
        },
      },
      next: 'ticket',
    },
    {
      id: 'ticket',
      type: 'ticket',
      data: {
        complete: true,
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Appointment confirmed',
          subtitle: '{{category}} · Glow & Co., Bandra West',
          fields: [
            { label: 'Guest', value: '{{guestName}}' },
            { label: 'Service', value: '{{service}}' },
            { label: 'Add-on', value: '{{addOn}}' },
            { label: 'Stylist', value: '{{stylist}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Station', value: 'Chair {{chair}}' },
            { label: 'Deposit paid', value: '{{deposit|money}}' },
          ],
          qrData: 'glowandco://visit/{{bookingId}}?slot={{slot}}',
        },
        caption:
          'Show this QR at reception. Please arrive 10 minutes early for a quick consultation.',
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Save the appointment to your calendar, or call us if anything changes.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: '{{service}} at Glow & Co.',
              start: '{{slot}}',
              durationMin: 60,
              location: SALON.address,
            },
          },
          { kind: 'call', title: 'Call the salon', phone: SALON.phone },
        ],
      },
      next: 'pin',
    },
    {
      id: 'pin',
      type: 'location',
      data: {
        location: { name: SALON.name, address: SALON.address, lat: SALON.lat, lng: SALON.lng },
        caption: 'First floor, above the bakery. Valet parking on Hill Road from 11 am.',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Appointment reminder',
        note: 'Real use: 3 hours before. Short for the demo.',
      },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'See you soon, {{user.firstName}}! We will remind you before your visit.',
        showMenu: true,
      },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Appointment reminder',
        text: 'Hi {{user.firstName}}, a reminder: *{{service}}* with {{stylist}} on {{dayLabel}} at {{slot|time}}.\nBooking {{bookingId}}. Tip: come with clean, dry hair for colour services.',
        buttons: [
          { id: 'confirm', title: 'I’ll be there' },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'r-ok', reschedule: 're-day', cancel: 'r-cancel' },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: { text: 'Wonderful — {{stylist}} is looking forward to it.', showMenu: true },
    },
    {
      id: 're-day',
      type: 'list',
      data: {
        text: 'No problem. Pick a new day — your deposit carries over.',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, var: 'day' },
      },
      next: { pick: 're-slot' },
    },
    {
      id: 're-slot',
      type: 'list',
      data: {
        text: 'Free slots with {{stylist}} on {{dayLabel}}:',
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
      next: { pick: 're-done', 'other-day': 're-day' },
    },
    {
      id: 're-done',
      type: 'end',
      data: {
        text: 'Done — {{service}} moved to {{dayLabel}} at {{slot|time}}. Booking {{bookingId}} and your QR stay the same.',
        showMenu: true,
      },
    },
    {
      id: 'r-cancel',
      type: 'buttons',
      data: {
        text: 'Cancel booking {{bookingId}}? Your {{deposit|money}} deposit is refunded in full when you cancel 3 hours or more before.',
        buttons: [
          { id: 'yes', title: 'Yes, cancel', set: { refundId: '$id:RF' } },
          { id: 'keep', title: 'Keep it' },
        ],
      },
      next: { yes: 'r-cancelled', keep: 'r-ok' },
    },
    {
      id: 'r-cancelled',
      type: 'end',
      data: {
        text: 'Cancelled. Refund reference {{refundId}} — it reaches your account in 5–7 working days. Hope to pamper you soon!',
        showMenu: true,
      },
    },
    {
      id: 'not-booked',
      type: 'end',
      data: {
        text: 'No booking was made. You can start again from the menu at any time.',
        showMenu: true,
      },
    },
  ],
});
