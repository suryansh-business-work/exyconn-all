/**
 * Workshop booking: grouped workshop list → workshop card → in person or live online → batch
 * day and time → level and email → order with kit and early-bird discount → QR seat pass,
 * prep-kit PDF, calendar and a "starts in an hour" reminder with a handoff for help.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import { COMPANY, rupees, SUPPORT, WORKSHOPS, type Workshop } from './data';

const PICK = 'pick';
const DAY = 'day';
const TICKET = 'ticket';
const R_END = 'r-end';

function workshopRow(w: Workshop) {
  return {
    id: w.id,
    title: w.title,
    description: `${w.description} · ${rupees(w.fee)}`,
    set: {
      workshop: w.title,
      mentor: w.mentor,
      mentorBio: w.mentorBio,
      wsFee: String(w.fee),
      wsMrp: String(w.mrp),
      kitFee: String(w.kit),
      hours: w.hours,
      seatsTotal: String(w.seats),
      bring: w.bring,
    },
  };
}

const ALL = WORKSHOPS.flatMap((g) => g.workshops);
const ITEMS = [{ id: 'seat', name: 'Workshop seat — {{workshop}}', qty: 1, price: '{{wsFee}}' }];
const DISCOUNT = { id: 'early', label: 'Early-bird discount', amount: '-{{discount}}' };
const KIT = { id: 'kit', label: 'Materials kit', amount: '{{kitFee}}' };

/** Pending summary and paid receipt, with or without a materials kit line. */
function orderPair(id: string, withKit: boolean): AuthorNode[] {
  const adjustments = withKit ? [KIT, DISCOUNT] : [DISCOUNT];
  return [
    {
      id: `sum-${id}`,
      type: 'order',
      data: {
        set: { orderId: '$id:WSP', discount: '$price:150:30' },
        order: {
          orderId: '{{orderId}}',
          title: 'Workshop booking',
          items: ITEMS,
          adjustments,
          status: 'pending',
          payTitle: 'Pay now',
        },
      },
      next: { pay: `paid-${id}` },
    },
    {
      id: `paid-${id}`,
      type: 'order',
      data: {
        set: { wsBookingId: '$id:WS', seatNo: '$int:1:{{seatsTotal}}' },
        order: {
          orderId: '{{orderId}}',
          title: 'Payment received',
          items: ITEMS,
          adjustments,
          status: 'paid',
        },
      },
      next: TICKET,
    },
  ];
}

export const workshop = defineWorkflow({
  key: 'workshop',
  name: 'Book a workshop',
  description: 'Pottery, baking, career skills and kids classes',
  keywords: ['workshop', 'class', 'masterclass', 'course', 'pottery', 'baking', 'learn'],
  nodes: [
    {
      id: PICK,
      type: 'list',
      data: {
        header: 'Weekend workshops',
        text: 'Small batches, expert mentors and everything you need on the day. What would you like to learn, {{user.firstName}}?',
        footer: 'Fees include GST',
        button: 'Workshops',
        sections: WORKSHOPS.map((g) => ({
          id: g.id,
          title: g.title,
          rows: g.workshops.map(workshopRow),
        })),
      },
      next: Object.fromEntries(ALL.map((w) => [w.id, 'card'])),
    },
    {
      id: 'card',
      type: 'product',
      data: {
        product: {
          id: 'chosen-workshop',
          title: '{{workshop}}',
          subtitle: '{{hours}} · with {{mentor}} · {{seatsTotal}} seats per batch',
          price: '{{wsFee}}',
          mrp: '{{wsMrp}}',
          badge: 'Early bird',
          image: { icon: 'school', accent: 'pink', title: '{{workshop}}' },
        },
      },
      next: 'mentor',
    },
    {
      id: 'mentor',
      type: 'buttons',
      data: {
        text: 'Your mentor is *{{mentor}}* — {{mentorBio}}.\nWhat to bring: {{bring}}.\nHow would you like to attend?',
        buttons: [
          {
            id: 'studio',
            title: 'In person',
            set: { mode: 'studio', modeLabel: 'In person, Spotlight Studio' },
          },
          {
            id: 'online',
            title: 'Live online',
            set: { mode: 'online', modeLabel: 'Live online (kit couriered)' },
          },
          { id: 'other', title: 'Other workshops' },
        ],
      },
      next: { studio: 'studio-pin', online: 'online-note', other: PICK },
    },
    {
      id: 'studio-pin',
      type: 'location',
      data: {
        location: {
          name: 'Spotlight Studio',
          address: COMPANY.studio,
          lat: COMPANY.studioLat,
          lng: COMPANY.studioLng,
        },
        caption:
          'All in-person batches run here: first floor, lift access, free parking after 6 pm.',
      },
      next: DAY,
    },
    {
      id: 'online-note',
      type: 'text',
      data: {
        text: 'Online batches are live on video with the mentor watching your work. Any materials kit reaches you 2 days before the class.',
      },
      next: DAY,
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day would you like to join *{{workshop}}*?',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, var: 'day' },
      },
      next: { pick: 'batch' },
    },
    {
      id: 'batch',
      type: 'list',
      data: {
        text: 'Batches on {{dayLabel}} (IST), {{hours}} each:',
        button: 'Choose batch',
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
          to: 18,
          stepMin: 120,
          take: 4,
          var: 'slot',
        },
      },
      next: { pick: 'level', 'other-day': DAY },
    },
    {
      id: 'level',
      type: 'buttons',
      data: {
        text: 'How much have you done before? It helps {{mentor}} pair you up.',
        buttons: [
          { id: 'new', title: 'Brand new', set: { level: 'Beginner', attEmail: '{{user.email}}' } },
          {
            id: 'some',
            title: 'A little',
            set: { level: 'Some experience', attEmail: '{{user.email}}' },
          },
          {
            id: 'pro',
            title: 'Quite a lot',
            set: { level: 'Advanced', attEmail: '{{user.email}}' },
          },
        ],
      },
      next: { new: 'has-email', some: 'has-email', pro: 'has-email' },
    },
    {
      id: 'has-email',
      type: 'condition',
      data: {
        note: 'The prep kit goes by email too; ask when the profile has none.',
        cases: [{ id: 'missing', var: 'attEmail', op: 'empty' }],
      },
      next: { missing: 'ask-email', else: 'kit-check' },
    },
    {
      id: 'ask-email',
      type: 'input',
      data: {
        prompt: 'Which email should we send the prep kit and invoice to?',
        var: 'attEmail',
        kind: 'email',
      },
      next: 'kit-check',
    },
    {
      id: 'kit-check',
      type: 'condition',
      data: {
        note: 'Workshops with nothing to take home have no kit line.',
        cases: [{ id: 'none', var: 'kitFee', op: 'eq', value: '0' }],
      },
      next: { none: 'sum-nokit', else: 'sum-kit' },
    },
    ...orderPair('kit', true),
    ...orderPair('nokit', false),
    {
      id: TICKET,
      type: 'ticket',
      data: {
        complete: true,
        ticket: {
          ticketId: '{{wsBookingId}}',
          title: 'Workshop seat confirmed',
          subtitle: '{{workshop}} · Spotlight Live',
          fields: [
            { label: 'Name', value: '{{user.fullName}}' },
            { label: 'Mentor', value: '{{mentor}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Batch', value: '{{slotLabel}}' },
            { label: 'Duration', value: '{{hours}}' },
            { label: 'Mode', value: '{{modeLabel}}' },
            { label: 'Level', value: '{{level}}' },
            { label: 'Seat', value: '{{seatNo}}' },
          ],
          qrData: 'spotlight://workshop/{{wsBookingId}}?batch={{slot}}',
        },
        caption: 'Show this QR at the studio desk, or keep it handy to join online.',
      },
      next: 'prep-kit',
    },
    {
      id: 'prep-kit',
      type: 'document',
      data: {
        document: {
          fileName: 'Spotlight_Workshop_Prep_Kit.pdf',
          fileType: 'PDF',
          pages: 2,
          sizeKb: 286,
          preview: {
            title: 'Workshop prep kit',
            subtitle: '{{workshop}} with {{mentor}}',
            sections: [
              {
                kind: 'fields',
                heading: 'Your booking',
                fields: [
                  { label: 'Booking', value: '{{wsBookingId}}' },
                  { label: 'Name', value: '{{user.fullName}}' },
                  { label: 'Email', value: '{{attEmail}}' },
                  { label: 'When', value: '{{dayLabel}}, {{slotLabel}}' },
                  { label: 'Mode', value: '{{modeLabel}}' },
                ],
              },
              {
                kind: 'table',
                heading: 'Agenda',
                columns: ['Part', 'What happens', 'Time'],
                rows: [
                  { id: 'intro', cells: ['Welcome', 'Introductions and a quick demo', '15 min'] },
                  {
                    id: 'guided',
                    cells: ['Guided practice', 'Step by step with the mentor', 'About half'],
                  },
                  {
                    id: 'solo',
                    cells: ['Your project', 'Build your own piece, with help', 'The rest'],
                  },
                  { id: 'wrap', cells: ['Wrap-up', 'Feedback, photos and next steps', '15 min'] },
                ],
              },
              {
                kind: 'text',
                heading: 'Before you come',
                text: 'What to bring: {{bring}}. Arrive 10 minutes early. Refreshments are on us. A certificate of participation is emailed after the class.',
              },
            ],
            footer: 'Spotlight Live · Free reschedule up to 24 hours before the batch',
          },
        },
        caption: 'Your prep kit. A copy is on its way to {{attEmail}}.',
      },
      next: 'mode-route',
    },
    {
      id: 'mode-route',
      type: 'condition',
      data: { cases: [{ id: 'online', var: 'mode', op: 'eq', value: 'online' }] },
      next: { online: 'cta-online', else: 'cta-studio' },
    },
    {
      id: 'cta-online',
      type: 'cta',
      data: {
        text: 'Save the batch to your calendar. The join link opens 10 minutes before the start.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: '{{workshop}} (online)',
              start: '{{slot}}',
              durationMin: 180,
              location: COMPANY.online,
            },
          },
          { kind: 'url', title: 'Join link', url: COMPANY.online },
        ],
      },
      next: 'remind',
    },
    {
      id: 'cta-studio',
      type: 'cta',
      data: {
        text: 'Save the batch to your calendar, or call the studio if you need anything.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: '{{workshop}} — Spotlight Studio',
              start: '{{slot}}',
              durationMin: 180,
              location: COMPANY.studio,
            },
          },
          { kind: 'call', title: 'Call the studio', phone: COMPANY.phone },
        ],
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 18_000,
        label: 'Workshop starts soon',
        note: 'Real use: one hour before the batch.',
      },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'See you in class, {{user.firstName}}! We will ping you an hour before.',
        showMenu: true,
      },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Starts in 1 hour',
        text: '*{{workshop}}* with {{mentor}} starts at {{slotLabel}} ({{modeLabel}}).\nBooking {{wsBookingId}} · seat {{seatNo}}.',
        buttons: [
          { id: 'coming', title: 'On my way' },
          { id: 'late', title: 'Running late' },
          { id: 'help', title: 'Need help' },
        ],
      },
      next: { coming: R_END, late: 'r-late', help: 'r-help' },
    },
    {
      id: 'r-late',
      type: 'text',
      data: {
        text: 'No problem — we have told {{mentor}} and will hold your seat for 20 minutes. The first part is a demo, so you will not miss the hands-on work.',
      },
      next: R_END,
    },
    {
      id: 'r-help',
      type: 'handoff',
      data: {
        agentName: SUPPORT.agentName,
        text: 'Hi {{user.firstName}}, Kabir here. I can see booking {{wsBookingId}} for {{workshop}}. What do you need?',
      },
      next: R_END,
    },
    {
      id: R_END,
      type: 'end',
      data: { text: 'Enjoy the workshop, {{user.firstName}}.', showMenu: true },
    },
  ],
});
