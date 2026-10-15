import { toWorkflowDef, type SeedWorkflow, type WaGraph } from '@exyconn/wa-flow';

/**
 * Starter call flows for four seeded examples (by their key), so Tech > Demos > Calling bot >
 * Call flows opens on real flows. Voice nodes only: what the bot says, the choices it offers
 * aloud, the details it collects, and where each answer leads.
 */
const clinic: SeedWorkflow = {
  key: 'clinic-appointment',
  name: 'Clinic booking call',
  description: 'Book, move or cancel an appointment',
  keywords: [],
  nodes: [
    {
      id: 'greet',
      type: 'buttons',
      data: {
        text: 'Would you like to book a new appointment, move one, or cancel one?',
        buttons: [
          { id: 'book', title: 'Book' },
          { id: 'move', title: 'Move' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { book: 'speciality', move: 'booking-ref', cancel: 'booking-ref' },
    },
    {
      id: 'speciality',
      type: 'list',
      data: {
        text: 'Which doctor would you like to see?',
        button: 'Specialities',
        sections: [
          {
            id: 'doctors',
            title: 'Doctors',
            rows: [
              { id: 'gp', title: 'General physician' },
              { id: 'paeds', title: 'Paediatrician' },
              { id: 'derm', title: 'Dermatologist' },
              { id: 'ortho', title: 'Orthopaedic' },
            ],
          },
        ],
      },
      next: { gp: 'day', paeds: 'day', derm: 'day', ortho: 'day' },
    },
    {
      id: 'day',
      type: 'input',
      data: { prompt: 'Which day suits you?', var: 'day', kind: 'date' },
      next: 'patient',
    },
    {
      id: 'patient',
      type: 'input',
      data: { prompt: 'May I have the patient’s full name?', var: 'patient', kind: 'name' },
      next: 'confirm',
    },
    {
      id: 'confirm',
      type: 'end',
      data: {
        text: 'You are booked for {{day}}, {{patient}}. We will send the details by SMS. Take care!',
        showMenu: false,
        complete: true,
      },
    },
    {
      id: 'booking-ref',
      type: 'input',
      data: {
        prompt: 'Sure. What is the phone number the booking was made with?',
        var: 'phone',
        kind: 'phone',
      },
      next: 'handled',
    },
    {
      id: 'handled',
      type: 'end',
      data: {
        text: 'Done — I have updated your booking and you will get an SMS confirmation.',
        showMenu: false,
        complete: true,
      },
    },
  ],
};

const realEstate: SeedWorkflow = {
  key: 'real-estate-lead',
  name: 'Property lead qualification',
  description: 'Qualify a buyer and offer a site visit',
  keywords: [],
  nodes: [
    {
      id: 'intent',
      type: 'buttons',
      data: {
        text: 'Are you looking to buy or to rent?',
        buttons: [
          { id: 'buy', title: 'Buy' },
          { id: 'rent', title: 'Rent' },
        ],
      },
      next: { buy: 'city', rent: 'city' },
    },
    {
      id: 'city',
      type: 'input',
      data: { prompt: 'Which city and area are you looking in?', var: 'area', kind: 'text' },
      next: 'budget',
    },
    {
      id: 'budget',
      type: 'buttons',
      data: {
        text: 'What budget do you have in mind?',
        buttons: [
          { id: 'under-75', title: 'Under 75 lakh' },
          { id: '75-150', title: '75 lakh–1.5 cr' },
          { id: 'above', title: 'Above 1.5 cr' },
        ],
      },
      next: { 'under-75': 'bhk', '75-150': 'bhk', above: 'senior' },
    },
    {
      id: 'bhk',
      type: 'buttons',
      data: {
        text: 'How many bedrooms do you need?',
        buttons: [
          { id: 'two', title: '2 BHK' },
          { id: 'three', title: '3 BHK' },
          { id: 'four', title: '4 BHK or more' },
        ],
      },
      next: { two: 'visit', three: 'visit', four: 'visit' },
    },
    {
      id: 'senior',
      type: 'handoff',
      data: {
        text: 'For premium homes our senior consultant handles your search personally.',
        agentName: 'our senior consultant',
      },
      next: 'visit',
    },
    {
      id: 'visit',
      type: 'input',
      data: {
        prompt: 'Shall we arrange a site visit? Which day works for you?',
        var: 'visitDay',
        kind: 'date',
      },
      next: 'bye',
    },
    {
      id: 'bye',
      type: 'end',
      data: {
        text: 'Great, your visit is on {{visitDay}} in {{area}}. You will get the address and the consultant’s number by SMS.',
        showMenu: false,
        complete: true,
      },
    },
  ],
};

const orderStatus: SeedWorkflow = {
  key: 'order-status',
  name: 'Order status call',
  description: 'Track an order or start a return',
  keywords: [],
  nodes: [
    {
      id: 'order',
      type: 'input',
      data: { prompt: 'Could you tell me your order number?', var: 'orderNo', kind: 'text' },
      next: 'need',
    },
    {
      id: 'need',
      type: 'ai',
      data: {
        prompt: 'Thanks. How can I help with order {{orderNo}}?',
        intents: [
          { id: 'where', description: 'Wants to know where the order is or when it arrives' },
          { id: 'return', description: 'Wants to return, exchange or cancel the order' },
          { id: 'person', description: 'Is upset or asks for a person' },
        ],
        entities: [],
        retry: 'Sorry, is this about delivery, a return, or something else?',
      },
      next: { where: 'eta', return: 'reason', person: 'agent', fallback: 'agent' },
    },
    {
      id: 'eta',
      type: 'end',
      data: {
        text: 'Order {{orderNo}} is out for delivery and should reach you today by 7 pm.',
        showMenu: false,
        complete: true,
      },
    },
    {
      id: 'reason',
      type: 'list',
      data: {
        text: 'What is the reason for the return?',
        button: 'Reasons',
        sections: [
          {
            id: 'reasons',
            title: 'Reasons',
            rows: [
              { id: 'damaged', title: 'Arrived damaged' },
              { id: 'wrong', title: 'Wrong item' },
              { id: 'size', title: 'Size or fit' },
              { id: 'mind', title: 'Changed my mind' },
            ],
          },
        ],
      },
      next: { damaged: 'pickup', wrong: 'pickup', size: 'pickup', mind: 'pickup' },
    },
    {
      id: 'pickup',
      type: 'end',
      data: {
        text: 'I have booked a free pickup for tomorrow. Your refund starts as soon as it is collected.',
        showMenu: false,
        complete: true,
      },
    },
    {
      id: 'agent',
      type: 'handoff',
      data: {
        text: 'I am sorry about this. Let me bring in a colleague who can sort it out.',
        agentName: 'a customer care specialist',
      },
      next: 'close',
    },
    { id: 'close', type: 'end', data: { text: 'Thank you for your patience.', showMenu: false } },
  ],
};

const saasDemo: SeedWorkflow = {
  key: 'saas-demo-booking',
  name: 'SaaS demo booking',
  description: 'Qualify a trial user and book a demo',
  keywords: [],
  nodes: [
    {
      id: 'team',
      type: 'buttons',
      data: {
        text: 'How big is the team that would use it?',
        buttons: [
          { id: 'small', title: 'Under 20' },
          { id: 'mid', title: '20 to 200' },
          { id: 'large', title: 'Over 200' },
        ],
      },
      next: { small: 'goal', mid: 'goal', large: 'goal' },
    },
    {
      id: 'goal',
      type: 'input',
      data: {
        prompt: 'What is the main thing you want it to do for you?',
        var: 'goal',
        kind: 'text',
      },
      next: 'email',
    },
    {
      id: 'email',
      type: 'input',
      data: {
        prompt: 'What is the best email to send the invite to?',
        var: 'email',
        kind: 'email',
      },
      next: 'slot',
    },
    {
      id: 'slot',
      type: 'input',
      data: { prompt: 'Which day works for a 30-minute demo?', var: 'demoDay', kind: 'date' },
      next: 'done',
    },
    {
      id: 'done',
      type: 'end',
      data: {
        text: 'Booked for {{demoDay}}. The invite is on its way to {{email}}, and we will tailor the demo to {{goal}}.',
        showMenu: false,
        complete: true,
      },
    },
  ],
};

/** Each starter flow by the key of the seeded example it belongs to. */
export const SCENARIO_FLOWS: Readonly<Record<string, WaGraph>> = Object.fromEntries(
  [clinic, realEstate, orderStatus, saasDemo].map((flow) => [
    flow.key,
    toWorkflowDef(flow, 0).graph,
  ]),
);
