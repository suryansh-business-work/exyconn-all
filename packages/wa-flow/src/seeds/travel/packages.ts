/**
 * Package selection: category → package carousel → details → day-wise plan (PDF) → departure
 * (next days or a typed date) → travellers → lead traveller → review → booking advance →
 * QR voucher and a pre-departure checklist that arrives later.
 */
import { defineWorkflow } from '../../author';
import type { Product } from '../../schema';
import { AGENCY, DOMESTIC, HONEYMOON, INTERNATIONAL, TRIP_DESK, type TourPackage } from './data';

const DETAILS = 'details';

/** What picking a package stores for the rest of the flow. */
const chosen = (pkg: TourPackage) => ({
  pkg: pkg.title,
  pkgId: pkg.id,
  places: pkg.subtitle,
  nights: String(pkg.nights),
  price: String(pkg.price),
  mrp: String(pkg.mrp),
  hotel: pkg.hotel,
  highlights: pkg.highlights,
  plan: pkg.plan,
  advance: String(pkg.advance),
  advanceGst: String(Math.round(pkg.advance * 0.05)),
});

function packageCard(pkg: TourPackage): Product {
  return {
    id: pkg.id,
    title: pkg.title,
    subtitle: pkg.subtitle,
    price: pkg.price,
    mrp: pkg.mrp,
    badge: pkg.badge,
    image: { icon: pkg.icon, accent: pkg.accent, title: pkg.title },
    buttonTitle: 'View details',
    set: chosen(pkg),
  };
}

function carousel(id: string, text: string, packages: readonly TourPackage[]) {
  return {
    id,
    type: 'carousel' as const,
    data: { text, cards: packages.map(packageCard) },
    next: Object.fromEntries(packages.map((p) => [p.id, DETAILS])),
  };
}

export const packages = defineWorkflow({
  key: 'packages',
  name: 'Holiday packages',
  description: 'Browse India, international and honeymoon packages',
  keywords: ['package', 'packages', 'holiday', 'tour package', 'honeymoon', 'book a tour'],
  nodes: [
    {
      id: 'category',
      type: 'list',
      data: {
        header: 'Holiday packages',
        text: 'Hi {{user.firstName}}, every package includes stays, transfers, sightseeing and a 24×7 trip helpline. What kind of holiday are you looking for?',
        footer: 'Prices per person on twin sharing',
        button: 'Browse',
        sections: [
          {
            id: 'packages',
            title: 'Packages',
            rows: [
              {
                id: 'domestic',
                title: 'Within India',
                description: 'Kerala, Goa, Ladakh, Rajasthan, Kashmir',
              },
              {
                id: 'international',
                title: 'International',
                description: 'Dubai, Bali, Thailand, Europe, Singapore',
              },
              { id: 'honeymoon', title: 'Honeymoon', description: 'Maldives, Andaman, Mauritius' },
            ],
          },
          {
            id: 'help',
            title: 'Not sure yet?',
            rows: [
              {
                id: 'expert',
                title: 'Ask a travel expert',
                description: 'Free 20-minute call or video chat',
              },
            ],
          },
        ],
      },
      next: {
        domestic: 'c-domestic',
        international: 'c-international',
        honeymoon: 'c-honeymoon',
        expert: 'to-expert',
      },
    },
    carousel('c-domestic', 'Our most-loved trips within India. Swipe to compare.', DOMESTIC),
    carousel(
      'c-international',
      'International holidays with flights quoted separately. We help with visas too.',
      INTERNATIONAL,
    ),
    carousel(
      'c-honeymoon',
      'Honeymoon packages come with a cake, flower décor and one special dinner.',
      HONEYMOON,
    ),
    { id: 'to-expert', type: 'jump', data: { workflowKey: 'consultation' } },
    {
      id: DETAILS,
      type: 'image',
      data: {
        image: { icon: 'location', accent: 'teal', title: '{{pkg}}', subtitle: '{{places}}' },
        caption:
          '*{{pkg}}* · {{nights}} nights\n{{highlights}}\n*Stay:* {{hotel}}\n*Price:* {{price|money}} per person (was {{mrp|money}})\nIncludes stays, transfers, sightseeing and taxes. Flights are quoted separately.',
      },
      next: 'pkg-actions',
    },
    {
      id: 'pkg-actions',
      type: 'buttons',
      data: {
        text: 'What would you like to do?',
        buttons: [
          { id: 'book', title: 'Book now' },
          { id: 'plan', title: 'Day-wise plan' },
          { id: 'other', title: 'Other packages' },
        ],
      },
      next: { book: 'depart', plan: 'plan-doc', other: 'category' },
    },
    {
      id: 'plan-doc',
      type: 'document',
      data: {
        document: {
          fileName: 'TrailNest_Day_Wise_Plan.pdf',
          fileType: 'PDF',
          pages: 4,
          sizeKb: 860,
          preview: {
            title: '{{pkg}}',
            subtitle: '{{places}}',
            sections: [
              {
                kind: 'fields',
                heading: 'At a glance',
                fields: [
                  { label: 'Duration', value: '{{nights}} nights' },
                  { label: 'Stay', value: '{{hotel}}' },
                  { label: 'Price', value: '{{price|money}} per person, twin sharing' },
                  {
                    label: 'Booking advance',
                    value: '{{advance|money}}, refundable up to 30 days before',
                  },
                ],
              },
              { kind: 'text', heading: 'Day-wise plan', text: '{{plan}}' },
              {
                kind: 'text',
                heading: 'Inclusions',
                text: 'Stays as listed, daily breakfast, airport and inter-city transfers in a private AC car, sightseeing with entry tickets, driver allowances, tolls and GST.',
              },
              {
                kind: 'text',
                heading: 'Not included',
                text: 'Flights or trains, lunches, personal expenses, travel insurance (available as an add-on) and anything not listed above.',
              },
            ],
            footer:
              'Prices valid for travel in the next 60 days, subject to availability · TrailNest Holidays',
          },
        },
        caption: 'Here is the full day-wise plan for {{pkg}}, {{user.firstName}}.',
      },
      next: 'after-plan',
    },
    {
      id: 'after-plan',
      type: 'buttons',
      data: {
        text: 'Shall we hold your seats on {{pkg}}?',
        buttons: [
          { id: 'book', title: 'Book now' },
          { id: 'expert', title: 'Ask an expert' },
          { id: 'other', title: 'Other packages' },
        ],
      },
      next: { book: 'depart', expert: 'desk', other: 'category' },
    },
    {
      id: 'desk',
      type: 'handoff',
      data: {
        agentName: TRIP_DESK.agentName,
        text: 'Hi {{user.firstName}}, I’m Sana from the trip desk. I have {{pkg}} open — would you like to change the hotels, add flights or move a day around?',
      },
      next: 'desk-end',
    },
    { id: 'desk-end', type: 'end', data: { showMenu: true } },
    {
      id: 'depart',
      type: 'list',
      data: {
        text: 'When would you like to start {{pkg}}? These are our next guaranteed departures, or pick a date of your own.',
        footer: 'Dates in IST',
        button: 'Choose date',
        sections: [
          {
            id: 'later',
            title: 'Later',
            rows: [{ id: 'own-date', title: 'Another date', description: 'Type any start date' }],
          },
        ],
        dynamic: { kind: 'days', count: 8, var: 'depart' },
      },
      next: { pick: 'pax', 'own-date': 'own-date' },
    },
    {
      id: 'own-date',
      type: 'input',
      data: {
        prompt: 'Please type your start date as DD/MM/YYYY, e.g. 20/12/2026.',
        var: 'departLabel',
        kind: 'date',
        error: 'Please type the start date as DD/MM/YYYY, e.g. 20/12/2026.',
      },
      next: 'pax',
    },
    {
      id: 'pax',
      type: 'buttons',
      data: {
        text: 'How many travellers?',
        buttons: [
          { id: 'couple', title: '2 adults', set: { pax: '2 adults' } },
          { id: 'family', title: '2 adults, 2 kids', set: { pax: '2 adults, 2 children' } },
          { id: 'other', title: 'Another number' },
        ],
      },
      next: { couple: 'lead', family: 'lead', other: 'pax-count' },
    },
    {
      id: 'pax-count',
      type: 'input',
      data: {
        prompt: 'How many travellers in all, including children?',
        var: 'paxCount',
        kind: 'number',
        error: 'Please type the number of travellers, e.g. 5.',
      },
      next: 'pax-set',
    },
    {
      id: 'pax-set',
      type: 'text',
      data: {
        set: { pax: '{{paxCount}} travellers' },
        text: 'Noted — {{pax}}. Children under 5 travel free on most packages.',
      },
      next: 'lead',
    },
    {
      id: 'lead',
      type: 'condition',
      data: {
        set: { leadName: '{{user.fullName}}', leadPhone: '{{user.phone}}' },
        note: 'The signed-in user is the lead traveller; ask for a phone when the profile has none.',
        cases: [{ id: 'missing', var: 'leadPhone', op: 'empty' }],
      },
      next: { missing: 'ask-phone', else: 'review' },
    },
    {
      id: 'ask-phone',
      type: 'input',
      data: {
        prompt: 'Which mobile number should your tour manager call during the trip?',
        var: 'leadPhone',
        kind: 'phone',
      },
      next: 'review',
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check your booking',
        text: '*Package:* {{pkg}} ({{nights}} nights)\n*Starts:* {{departLabel}}\n*Travellers:* {{pax}}\n*Lead traveller:* {{leadName}}, {{leadPhone}}\n*Price:* {{price|money}} per person\n*Pay now:* {{advance|money}} advance + GST',
        footer: 'Advance fully refundable up to 30 days before travel',
        buttons: [
          { id: 'confirm', title: 'Pay advance' },
          { id: 'change', title: 'Change date' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'secure', change: 'depart', cancel: 'not-booked' },
    },
    {
      id: 'secure',
      type: 'notice',
      data: {
        text: 'Payments go through TrailNest’s payment partner. We never ask for your card PIN or OTP in this chat.',
      },
      next: 'summary',
    },
    {
      id: 'summary',
      type: 'order',
      data: {
        set: { orderId: '$id:PAY' },
        order: {
          orderId: '{{orderId}}',
          title: 'Holiday booking advance',
          items: [{ id: 'advance', name: 'Advance — {{pkg}}', qty: 1, price: '{{advance}}' }],
          adjustments: [{ id: 'gst', label: 'GST 5%', amount: '{{advanceGst}}' }],
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
        set: { bookingId: '$id:TN' },
        order: {
          orderId: '{{orderId}}',
          title: 'Payment received',
          items: [{ id: 'advance', name: 'Advance — {{pkg}}', qty: 1, price: '{{advance}}' }],
          adjustments: [{ id: 'gst', label: 'GST 5%', amount: '{{advanceGst}}' }],
          status: 'paid',
        },
      },
      next: 'voucher',
    },
    {
      id: 'voucher',
      type: 'ticket',
      data: {
        complete: true,
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Holiday booked',
          subtitle: '{{pkg}} · TrailNest Holidays',
          fields: [
            { label: 'Lead traveller', value: '{{leadName}}' },
            { label: 'Starts', value: '{{departLabel}}' },
            { label: 'Duration', value: '{{nights}} nights' },
            { label: 'Travellers', value: '{{pax}}' },
            { label: 'Advance paid', value: '{{advance|money}} + GST' },
            { label: 'Balance due', value: '21 days before travel' },
          ],
          qrData: 'trailnest://booking/{{bookingId}}?pkg={{pkgId}}',
        },
        caption: 'Your booking voucher. Show this QR to your driver or tour manager on day 1.',
      },
      next: 'help',
    },
    {
      id: 'help',
      type: 'cta',
      data: {
        text: 'Your tour manager will be in touch 3 days before you leave. Need anything before that?',
        actions: [
          { kind: 'call', title: 'Call trip helpline', phone: AGENCY.helpline },
          { kind: 'url', title: 'Visa & forex help', url: AGENCY.visa },
        ],
      },
      next: 'checklist',
    },
    {
      id: 'checklist',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Pre-departure checklist',
        note: 'Real use: 7 days before departure. Short for the demo.',
      },
      next: { next: 'booked', later: 'c-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'You are all set, {{user.firstName}}. We will send your checklist closer to the date.',
        showMenu: true,
      },
    },
    {
      id: 'c-msg',
      type: 'buttons',
      data: {
        header: 'Pre-departure checklist',
        text: '{{pkg}} starts on {{departLabel}}. Before you go:\n• Photo ID (passport for international trips) for every traveller\n• Balance payment of the package\n• Comfortable shoes and a light jacket\n• Your booking voucher {{bookingId}}',
        buttons: [
          { id: 'itinerary', title: 'Get itinerary' },
          { id: 'desk', title: 'Talk to us' },
          { id: 'ok', title: 'All good' },
        ],
      },
      next: { itinerary: 'to-itinerary', desk: 'desk', ok: 'c-ok' },
    },
    { id: 'to-itinerary', type: 'jump', data: { workflowKey: 'itinerary' } },
    {
      id: 'c-ok',
      type: 'end',
      data: { text: 'Wonderful. Have a lovely trip, {{user.firstName}}!', showMenu: true },
    },
    {
      id: 'not-booked',
      type: 'end',
      data: {
        text: 'No booking was made. You can browse packages again from the menu at any time.',
        showMenu: true,
      },
    },
  ],
});
