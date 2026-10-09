/**
 * Private-event enquiry: occasion → free text read by an `ai` node ("kal shaam 5 baje, 80
 * log, budget 2 lakh") → anything it missed is asked with buttons, lists and inputs → venue
 * carousel sized to the guest count → estimate PDF → site-visit booking with a QR pass and a
 * reminder, or a handoff to the planner.
 */
import { defineWorkflow } from '../../author';
import type { Product } from '../../schema';
import {
  BUDGET_BANDS,
  CITIES,
  GUEST_BANDS,
  LARGE_VENUES,
  OCCASIONS,
  PLANNER,
  rupees,
  SMALL_VENUES,
  type Venue,
} from './data';

const DESCRIBE = 'describe';
const GUESTS = 'g-band';
const HAS_BUDGET = 'has-budget';
const HAS_WHEN = 'has-when';
const HAS_CITY = 'has-city';
const SIZE = 'size';
const BRIEF = 'brief';
const PLANNER_NODE = 'planner';
const VISIT_DAY = 'visit-day';

function venueCard(venue: Venue): Product {
  return {
    id: venue.id,
    title: venue.title,
    subtitle: `${venue.subtitle} · ${venue.capacity}`,
    price: venue.perGuest,
    badge: venue.badge,
    image: { icon: venue.icon, accent: 'purple', title: venue.title, subtitle: 'per guest, from' },
    buttonTitle: 'Shortlist',
    set: { venueName: venue.title, perGuest: String(venue.perGuest), capacity: venue.capacity },
  };
}

export const planEvent = defineWorkflow({
  key: 'plan-event',
  name: 'Plan a private event',
  description: 'Weddings, parties, offsites and conferences, end to end',
  keywords: [
    'plan event',
    'private event',
    'wedding',
    'birthday party',
    'corporate event',
    'venue',
    'offsite',
  ],
  nodes: [
    {
      id: 'occasion',
      type: 'list',
      data: {
        header: 'Private events',
        text: 'Our planners handle venue, food, decor, sound and guest management, {{user.firstName}}. What are you planning?',
        button: 'Occasions',
        sections: [
          {
            id: 'occasions',
            title: 'Occasions',
            rows: OCCASIONS.map((o) => ({ ...o, set: { occasion: o.title } })),
          },
        ],
      },
      next: Object.fromEntries(OCCASIONS.map((o) => [o.id, DESCRIBE])),
    },
    {
      id: DESCRIBE,
      type: 'ai',
      data: {
        prompt:
          'Tell me about your {{occasion}} in your own words — when, roughly how many guests, the budget and the city. For example: "kal shaam 5 baje, 80 log, budget 2 lakh, Bengaluru".',
        intents: [
          { id: 'plan', description: 'Shares details of the event: date, guests, budget or city' },
          { id: 'ideas', description: 'Is not sure yet and wants ideas or suggestions' },
          { id: 'human', description: 'Wants to talk to or get a call from a person' },
        ],
        entities: [
          {
            name: 'when',
            kind: 'datetime',
            description: 'When the event is, as the customer said it',
          },
          { name: 'guests', kind: 'number', description: 'Number of guests expected' },
          { name: 'budget', kind: 'text', description: 'Total budget as said, e.g. "₹2 lakh"' },
          { name: 'city', kind: 'location', description: 'City or area of the event' },
        ],
        retry: 'Sorry, I could not pick out the details. Let me ask you step by step.',
      },
      next: { plan: 'has-guests', ideas: 'ideas', human: PLANNER_NODE, fallback: GUESTS },
    },
    {
      id: 'ideas',
      type: 'text',
      data: {
        text: 'Happy to suggest ideas! Three quick questions and I will show venues and a rough estimate to get you started.',
      },
      next: GUESTS,
    },
    {
      id: 'has-guests',
      type: 'condition',
      data: {
        note: 'The reader may miss some details; each missing one is asked for.',
        cases: [{ id: 'missing', var: 'guests', op: 'empty' }],
      },
      next: { missing: GUESTS, else: HAS_BUDGET },
    },
    {
      id: GUESTS,
      type: 'buttons',
      data: {
        text: 'Roughly how many guests are you expecting?',
        buttons: GUEST_BANDS.map((g) => ({ id: g.id, title: g.title, set: { guests: g.guests } })),
      },
      next: Object.fromEntries(GUEST_BANDS.map((g) => [g.id, HAS_BUDGET])),
    },
    {
      id: HAS_BUDGET,
      type: 'condition',
      data: { cases: [{ id: 'missing', var: 'budget', op: 'empty' }] },
      next: { missing: 'budget', else: HAS_WHEN },
    },
    {
      id: 'budget',
      type: 'list',
      data: {
        text: 'What budget do you have in mind, all inclusive?',
        button: 'Budget',
        sections: [
          {
            id: 'bands',
            title: 'Budget',
            rows: BUDGET_BANDS.map((b) => ({
              id: b.id,
              title: b.title,
              description: b.description,
              set: { budget: b.budget },
            })),
          },
        ],
      },
      next: Object.fromEntries(BUDGET_BANDS.map((b) => [b.id, HAS_WHEN])),
    },
    {
      id: HAS_WHEN,
      type: 'condition',
      data: { cases: [{ id: 'missing', var: 'when', op: 'empty' }] },
      next: { missing: 'ask-when', else: HAS_CITY },
    },
    {
      id: 'ask-when',
      type: 'input',
      data: {
        prompt: 'Which date are you planning for? Please type it as DD/MM/YYYY.',
        var: 'when',
        kind: 'date',
        error: 'Please type the event date as DD/MM/YYYY, e.g. 14/02/2027.',
      },
      next: HAS_CITY,
    },
    {
      id: HAS_CITY,
      type: 'condition',
      data: { cases: [{ id: 'missing', var: 'city', op: 'empty' }] },
      next: { missing: 'city', else: SIZE },
    },
    {
      id: 'city',
      type: 'list',
      data: {
        text: 'Which city is the event in?',
        button: 'Cities',
        sections: [
          {
            id: 'cities',
            title: 'Cities we cover',
            rows: CITIES.map((c) => ({ ...c, set: { city: c.title } })),
          },
        ],
      },
      next: Object.fromEntries(CITIES.map((c) => [c.id, SIZE])),
    },
    {
      id: SIZE,
      type: 'condition',
      data: {
        note: 'More than 150 guests needs a large venue.',
        cases: [{ id: 'large', var: 'guests', op: 'gt', value: '150' }],
      },
      next: { large: 'large', else: 'small' },
    },
    {
      id: 'small',
      type: 'carousel',
      data: {
        text: 'Got it: *{{occasion}}* for about {{guests}} guests in {{city}}, {{when}}, budget {{budget}}.\nHere are venues that fit. Prices are per guest with food.',
        cards: SMALL_VENUES.map(venueCard),
      },
      next: Object.fromEntries(SMALL_VENUES.map((v) => [v.id, BRIEF])),
    },
    {
      id: 'large',
      type: 'carousel',
      data: {
        text: 'Got it: *{{occasion}}* for about {{guests}} guests in {{city}}, {{when}}, budget {{budget}}.\nFor a group this size, these venues work best. Prices are per guest with food.',
        cards: LARGE_VENUES.map(venueCard),
      },
      next: Object.fromEntries(LARGE_VENUES.map((v) => [v.id, BRIEF])),
    },
    {
      id: BRIEF,
      type: 'document',
      data: {
        set: { enquiryId: '$id:PE' },
        document: {
          fileName: 'Spotlight_Event_Estimate.pdf',
          fileType: 'PDF',
          pages: 4,
          sizeKb: 538,
          preview: {
            title: 'Event brief and estimate',
            subtitle: '{{occasion}} · {{venueName}}',
            sections: [
              {
                kind: 'fields',
                heading: 'Brief',
                fields: [
                  { label: 'Enquiry', value: '{{enquiryId}}' },
                  { label: 'Host', value: '{{user.fullName}}' },
                  { label: 'When', value: '{{when}}' },
                  { label: 'Guests', value: '{{guests}}' },
                  { label: 'City', value: '{{city}}' },
                  { label: 'Budget', value: '{{budget}}' },
                  { label: 'Venue', value: '{{venueName}} ({{capacity}})' },
                ],
              },
              {
                kind: 'table',
                heading: 'Estimate',
                columns: ['Item', 'Basis', 'Indicative cost'],
                rows: [
                  {
                    id: 'venue',
                    cells: ['Venue and catering', 'Per guest', 'from {{perGuest|money}}'],
                  },
                  {
                    id: 'decor',
                    cells: [
                      'Decor and florals',
                      'Theme package',
                      `${rupees(45000)} – ${rupees(250_000)}`,
                    ],
                  },
                  {
                    id: 'av',
                    cells: [
                      'Sound, lights and stage',
                      'Per event',
                      `${rupees(35000)} – ${rupees(180_000)}`,
                    ],
                  },
                  {
                    id: 'photo',
                    cells: [
                      'Photo and video',
                      'Per event',
                      `${rupees(25000)} – ${rupees(120_000)}`,
                    ],
                  },
                  {
                    id: 'guest',
                    cells: ['Invites, RSVP and check-in', 'WhatsApp + QR', `${rupees(8000)} flat`],
                  },
                  { id: 'fee', cells: ['Planning and on-site team', 'Of event cost', '8–12%'] },
                ],
              },
              {
                kind: 'text',
                heading: 'Next steps',
                text: 'A site visit locks the date for 72 hours at no cost. After that, a 25% advance confirms the venue. Guests get WhatsApp invites with QR check-in, and you get a live RSVP sheet.',
              },
            ],
            footer:
              'Indicative prices incl. GST · valid for 15 days · Spotlight Live Private Events',
          },
        },
        caption: 'Here is your brief with an indicative estimate for {{venueName}}.',
      },
      next: 'brief-next',
    },
    {
      id: 'brief-next',
      type: 'buttons',
      data: {
        text: 'What would you like to do next?',
        footer: 'Enquiry {{enquiryId}}',
        buttons: [
          { id: 'visit', title: 'Book site visit' },
          { id: 'planner', title: 'Talk to planner' },
          { id: 'later', title: 'Not now' },
        ],
      },
      next: { visit: VISIT_DAY, planner: PLANNER_NODE, later: 'later-end' },
    },
    {
      id: VISIT_DAY,
      type: 'list',
      data: {
        text: 'When would you like to see {{venueName}}? Visits take about 45 minutes with a planner.',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, skipSundays: true, var: 'visitDay' },
      },
      next: { pick: 'visit-slot' },
    },
    {
      id: 'visit-slot',
      type: 'list',
      data: {
        text: 'Visit times on {{visitDayLabel}}:',
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
          dayVar: 'visitDay',
          from: 10,
          to: 18,
          stepMin: 60,
          take: 6,
          var: 'visitSlot',
        },
      },
      next: { pick: 'visit-pass', 'other-day': VISIT_DAY },
    },
    {
      id: 'visit-pass',
      type: 'ticket',
      data: {
        complete: true,
        ticket: {
          ticketId: '{{enquiryId}}',
          title: 'Site visit booked',
          subtitle: '{{venueName}}',
          fields: [
            { label: 'Host', value: '{{user.fullName}}' },
            { label: 'Occasion', value: '{{occasion}}' },
            { label: 'Date', value: '{{visitDayLabel}}' },
            { label: 'Time', value: '{{visitSlotLabel}}' },
            { label: 'Planner', value: PLANNER.name },
            { label: 'Guests', value: '{{guests}}' },
          ],
          qrData: 'spotlight://visit/{{enquiryId}}?at={{visitSlot}}',
        },
        caption: 'Show this at the venue reception. Your date is held for 72 hours from the visit.',
      },
      next: 'visit-cal',
    },
    {
      id: 'visit-cal',
      type: 'cta',
      data: {
        text: '{{venueName}} — add the visit to your calendar or call {{plannerName}} directly.',
        set: { plannerName: PLANNER.name },
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: { title: 'Site visit — {{venueName}}', start: '{{visitSlot}}', durationMin: 45 },
          },
          { kind: 'call', title: 'Call planner', phone: PLANNER.phone },
        ],
      },
      next: 'visit-remind',
    },
    {
      id: 'visit-remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Site visit reminder',
        note: 'Real use: the morning of the visit.',
      },
      next: { next: 'visit-end', later: 'visit-r' },
    },
    {
      id: 'visit-end',
      type: 'end',
      data: {
        text: 'Lovely, {{user.firstName}}. {{plannerName}} will meet you at the venue.',
        showMenu: true,
      },
    },
    {
      id: 'visit-r',
      type: 'buttons',
      data: {
        header: 'Site visit today',
        text: 'Your visit to {{venueName}} is today at {{visitSlotLabel}}. {{plannerName}} will meet you at reception with menus and decor samples.',
        buttons: [
          { id: 'ok', title: 'See you there' },
          { id: 'move', title: 'Reschedule' },
          { id: 'talk', title: 'Talk to planner' },
        ],
      },
      next: { ok: 'visit-ok', move: VISIT_DAY, talk: PLANNER_NODE },
    },
    {
      id: 'visit-ok',
      type: 'end',
      data: { text: 'See you soon, {{user.firstName}}.', showMenu: true },
    },
    {
      id: PLANNER_NODE,
      type: 'handoff',
      data: {
        complete: true,
        agentName: PLANNER.agentName,
        text: "Hi {{user.firstName}}, I'm Tanvi, a senior planner at Spotlight Live. I have your {{occasion}} enquiry here — tell me what you have in mind and I will put together options, or I can call you.",
      },
      next: 'planner-card',
    },
    {
      id: 'planner-card',
      type: 'contact',
      data: {
        contact: {
          name: PLANNER.name,
          phone: PLANNER.phone,
          role: PLANNER.role,
          organisation: 'Spotlight Live',
        },
      },
      next: 'planner-end',
    },
    {
      id: 'planner-end',
      type: 'end',
      data: { showMenu: true },
    },
    {
      id: 'later-end',
      type: 'end',
      data: {
        text: 'No problem. Your brief {{enquiryId}} stays saved — type *plan event* any time to pick it up.',
        showMenu: true,
      },
    },
  ],
});
