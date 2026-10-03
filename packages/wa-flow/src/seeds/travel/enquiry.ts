/**
 * Tour enquiry: the customer describes the trip in their own words and the `ai` node reads the
 * destination, timing, party size and budget; when it cannot, a structured path asks for them
 * one by one. Ends in an enquiry ticket, a live consultant or a callback, and a quote PDF that
 * arrives later as a push.
 */
import { defineWorkflow } from '../../author';
import { AGENCY, BUDGETS, QUOTE_TIERS, rupees, TRIP_DESK, TRIP_TYPES } from './data';

const SUMMARY = 'summary';
const BUDGET_CHECK = 'budget-check';
/** Indicative per-person base the quote tiers scale from. */
const QUOTE_BASE = 42_000;

/** Each AI intent records the trip type, says so, then checks whether a budget came through. */
function intentAck(id: string, tripType: string, text: string) {
  return {
    id: `i-${id}`,
    type: 'text' as const,
    data: { set: { tripType }, text },
    next: BUDGET_CHECK,
  };
}

export const enquiry = defineWorkflow({
  key: 'enquiry',
  name: 'Plan a trip',
  description: 'Tell us your idea; get a tailored quote',
  keywords: ['enquiry', 'enquire', 'plan a trip', 'trip', 'quote', 'vacation', 'tour'],
  nodes: [
    {
      id: 'ask',
      type: 'ai',
      data: {
        set: {
          destination: 'Not decided yet',
          travelWhen: 'Flexible',
          travellers: '2',
          budget: '',
          callbackWhen: 'within 2 working hours',
        },
        prompt:
          'Hi {{user.firstName}} ✈️ Tell us about the trip you have in mind — where, when, how many of you and a rough budget. For example: "Kerala for 4 of us in December, around ₹30,000 each" or "Dubai next month, call me kal shaam 5 baje".',
        intents: [
          { id: 'domestic', description: 'A holiday within India' },
          { id: 'international', description: 'A holiday outside India' },
          { id: 'honeymoon', description: 'A honeymoon or a romantic trip for a couple' },
          { id: 'group', description: 'A group, corporate offsite, school or family-reunion trip' },
          {
            id: 'callback',
            description: 'The customer mainly wants a call back at a certain time',
          },
        ],
        entities: [
          {
            name: 'destination',
            kind: 'location',
            description: 'Where they want to go, e.g. "Kerala" or "Bali"',
          },
          {
            name: 'travelWhen',
            kind: 'text',
            description:
              'When they want to travel, in their words, e.g. "December" or "next long weekend"',
          },
          { name: 'travellers', kind: 'number', description: 'How many people are travelling' },
          {
            name: 'budget',
            kind: 'text',
            description: 'Budget as said, e.g. "₹30,000 per person" or "1.5 lakh total"',
          },
          {
            name: 'callbackWhen',
            kind: 'text',
            description: 'When they want a call, e.g. "tomorrow 5 pm" for "kal shaam 5 baje"',
          },
        ],
        retry: "Sorry, I couldn't quite follow that. Let me ask a few quick questions instead.",
      },
      next: {
        domestic: 'i-domestic',
        international: 'i-international',
        honeymoon: 'i-honeymoon',
        group: 'i-group',
        callback: 'i-callback',
        fallback: 'f-type',
      },
    },
    intentAck(
      'domestic',
      'Within India',
      'Lovely — {{destination}} it is. India has a trip for every season.',
    ),
    intentAck(
      'international',
      'International',
      'Great choice — {{destination}}. We will check visa and flight options too.',
    ),
    intentAck(
      'honeymoon',
      'Honeymoon',
      'Congratulations, {{user.firstName}}! Let us make {{destination}} special.',
    ),
    intentAck(
      'group',
      'Group or corporate',
      'Group trips are our speciality — {{travellers}} travellers to {{destination}}.',
    ),
    {
      id: 'i-callback',
      type: 'text',
      data: {
        set: { tripType: 'To discuss on call' },
        text: 'Sure. A consultant will call you {{callbackWhen}} (IST).',
      },
      next: BUDGET_CHECK,
    },
    {
      id: BUDGET_CHECK,
      type: 'condition',
      data: {
        note: 'The AI may not catch a budget; ask for one then.',
        cases: [{ id: 'missing', var: 'budget', op: 'empty' }],
      },
      next: { missing: 'f-budget', else: SUMMARY },
    },
    {
      id: 'f-type',
      type: 'list',
      data: {
        text: 'What kind of trip are you planning?',
        button: 'Trip type',
        sections: [
          {
            id: 'types',
            title: 'Trip type',
            rows: TRIP_TYPES.map((t) => ({ ...t, set: { tripType: t.title } })),
          },
        ],
      },
      next: Object.fromEntries(TRIP_TYPES.map((t) => [t.id, 'f-dest'])),
    },
    {
      id: 'f-dest',
      type: 'input',
      data: {
        prompt: 'Where would you like to go? A place, a region, or "not sure".',
        var: 'destination',
        kind: 'text',
      },
      next: 'f-when',
    },
    {
      id: 'f-when',
      type: 'input',
      data: {
        prompt: 'Roughly when? Type a start date as DD/MM/YYYY — we can stay flexible around it.',
        var: 'travelWhen',
        kind: 'date',
        error: 'Please type a start date as DD/MM/YYYY, e.g. 20/12/2026.',
      },
      next: 'f-pax',
    },
    {
      id: 'f-pax',
      type: 'input',
      data: {
        prompt: 'How many travellers, including children?',
        var: 'travellers',
        kind: 'number',
        error: 'Please type the number of travellers, e.g. 4.',
      },
      next: 'f-budget',
    },
    {
      id: 'f-budget',
      type: 'list',
      data: {
        text: 'And a rough budget per person, excluding flights?',
        button: 'Budget',
        sections: [
          {
            id: 'budgets',
            title: 'Per person',
            rows: BUDGETS.map((b) => ({ ...b, set: { budget: b.title } })),
          },
        ],
      },
      next: Object.fromEntries(BUDGETS.map((b) => [b.id, SUMMARY])),
    },
    {
      id: SUMMARY,
      type: 'buttons',
      data: {
        header: 'Your trip enquiry',
        text: '*Trip:* {{tripType}}\n*Destination:* {{destination}}\n*When:* {{travelWhen}}\n*Travellers:* {{travellers}}\n*Budget:* {{budget}}\n*Name:* {{user.fullName}}',
        footer: 'Free quote, no obligation',
        buttons: [
          { id: 'send', title: 'Send enquiry' },
          { id: 'edit', title: 'Edit details' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { send: 'phone-check', edit: 'f-type', cancel: 'not-sent' },
    },
    {
      id: 'phone-check',
      type: 'condition',
      data: {
        set: { contactPhone: '{{user.phone}}' },
        cases: [{ id: 'missing', var: 'contactPhone', op: 'empty' }],
      },
      next: { missing: 'ask-phone', else: 'contact-pref' },
    },
    {
      id: 'ask-phone',
      type: 'input',
      data: {
        prompt: 'Which mobile number should our consultant use?',
        var: 'contactPhone',
        kind: 'phone',
      },
      next: 'contact-pref',
    },
    {
      id: 'contact-pref',
      type: 'buttons',
      data: {
        text: 'How would you like to hear from us?',
        buttons: [
          { id: 'chat', title: 'Chat now', set: { channel: 'WhatsApp chat' } },
          { id: 'call', title: 'Call me back', set: { channel: 'Phone call, {{callbackWhen}}' } },
          { id: 'quote', title: 'Just send a quote', set: { channel: 'Quote on WhatsApp' } },
        ],
      },
      next: { chat: 'lead', call: 'lead', quote: 'lead' },
    },
    {
      id: 'lead',
      type: 'ticket',
      data: {
        complete: true,
        set: { enquiryId: '$id:ENQ' },
        ticket: {
          ticketId: '{{enquiryId}}',
          title: 'Enquiry received',
          subtitle: 'TrailNest Holidays · trip desk',
          fields: [
            { label: 'Name', value: '{{user.fullName}}' },
            { label: 'Mobile', value: '{{contactPhone}}' },
            { label: 'Trip', value: '{{tripType}}' },
            { label: 'Destination', value: '{{destination}}' },
            { label: 'When', value: '{{travelWhen}}' },
            { label: 'Travellers', value: '{{travellers}}' },
            { label: 'Budget', value: '{{budget}}' },
            { label: 'Contact', value: '{{channel}}' },
          ],
          qrData: 'trailnest://enquiry/{{enquiryId}}',
        },
        caption: 'Thanks, {{user.firstName}}. Quote this reference if you call us.',
      },
      next: 'route',
    },
    {
      id: 'route',
      type: 'condition',
      data: { cases: [{ id: 'chat', var: 'channel', op: 'eq', value: 'WhatsApp chat' }] },
      next: { chat: 'desk', else: 'quote-wait' },
    },
    {
      id: 'desk',
      type: 'handoff',
      data: {
        agentName: TRIP_DESK.agentName,
        text: 'Hi {{user.firstName}}, I’m Sana from the trip desk. I have enquiry {{enquiryId}} for {{destination}} open. Shall we start with dates or hotels?',
      },
      next: 'desk-cta',
    },
    {
      id: 'desk-cta',
      type: 'cta',
      data: {
        text: 'Prefer to talk? Call me directly, or see our ready-made packages meanwhile.',
        actions: [
          { kind: 'call', title: 'Call Sana', phone: TRIP_DESK.phone },
          { kind: 'url', title: 'All packages', url: AGENCY.website },
        ],
      },
      next: 'quote-wait',
    },
    {
      id: 'quote-wait',
      type: 'reminder',
      data: {
        afterMs: 15_000,
        label: 'Your trip quote is ready',
        note: 'Real use: when the consultant sends it.',
      },
      next: { next: 'waiting', later: 'quote' },
    },
    {
      id: 'waiting',
      type: 'end',
      data: {
        text: 'Our consultant is preparing your quote — it will appear right here.',
        showMenu: true,
      },
    },
    {
      id: 'quote',
      type: 'document',
      data: {
        document: {
          fileName: 'TrailNest_Trip_Quote.pdf',
          fileType: 'PDF',
          pages: 3,
          sizeKb: 540,
          preview: {
            title: 'Trip quote',
            subtitle: '{{destination}} · {{travellers}} travellers',
            sections: [
              {
                kind: 'fields',
                heading: 'Enquiry',
                fields: [
                  { label: 'Reference', value: '{{enquiryId}}' },
                  { label: 'Prepared for', value: '{{user.fullName}}' },
                  { label: 'Trip', value: '{{tripType}}' },
                  { label: 'When', value: '{{travelWhen}}' },
                  { label: 'Budget', value: '{{budget}}' },
                ],
              },
              {
                kind: 'table',
                heading: 'Options per person (twin sharing, excl. flights)',
                columns: ['Option', 'Stay', 'Price'],
                rows: QUOTE_TIERS.map((t) => ({
                  id: t.id,
                  cells: [t.name, t.stay, rupees(Math.round((QUOTE_BASE * t.factor) / 100) * 100)],
                })),
              },
              {
                kind: 'text',
                heading: 'Every option includes',
                text: 'Hotels with breakfast, airport and inter-city transfers, sightseeing with a local guide, all taxes and our 24×7 trip helpline. Flights are quoted at the live fare when you confirm.',
              },
            ],
            footer: 'Indicative prices, valid 7 days · TrailNest Holidays, Mumbai',
          },
        },
        caption:
          'Your quote is ready, {{user.firstName}}. Three options to compare — the Comfort one suits most families.',
      },
      next: 'quote-next',
    },
    {
      id: 'quote-next',
      type: 'buttons',
      data: {
        text: 'What would you like to do next?',
        buttons: [
          { id: 'packages', title: 'See packages' },
          { id: 'expert', title: 'Book an expert' },
          { id: 'menu', title: 'Main menu' },
        ],
      },
      next: { packages: 'to-packages', expert: 'to-expert', menu: 'menu-end' },
    },
    { id: 'to-packages', type: 'jump', data: { workflowKey: 'packages' } },
    { id: 'to-expert', type: 'jump', data: { workflowKey: 'consultation' } },
    { id: 'menu-end', type: 'end', data: { showMenu: true } },
    {
      id: 'not-sent',
      type: 'end',
      data: {
        text: 'No problem — nothing was sent. Come back whenever you are ready.',
        showMenu: true,
      },
    },
  ],
});
