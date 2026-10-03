/**
 * Vet appointment: species → pet's name → reason (or symptoms in free text, read by `ai`,
 * with an emergency path) → vet → clinic or video → day → slot → review → pay → QR ticket,
 * calendar, map pin or video link → reminder push to confirm, reschedule or cancel.
 */
import { defineWorkflow } from '../../author';
import { rupees } from '../healthcare/data';
import { CLINIC, CONCERNS, VET_ON_CALL, VETS, type Vet } from './data';

const REASON = 'reason';
const VET = 'vet';
const EMERGENCY = 'er';
const DAY = 'day';

function vetRow(vet: Vet) {
  return {
    id: vet.id,
    title: vet.name,
    description: `${vet.focus} · ${vet.years} yrs · ${rupees(vet.fee)}`,
    set: { vet: vet.name, vetQual: vet.qualification, fee: String(vet.fee) },
  };
}

export const vetAppointment = defineWorkflow({
  key: 'vet-appointment',
  name: 'Book a vet',
  description: 'Clinic visits and video consults with our vets',
  keywords: ['vet', 'doctor', 'appointment', 'sick', 'consult', 'not eating'],
  nodes: [
    {
      id: 'species',
      type: 'buttons',
      data: {
        header: 'Book a vet',
        text: 'Hi {{user.firstName}}, who are we seeing today?',
        buttons: [
          { id: 'dog', title: 'My dog', set: { species: 'dog' } },
          { id: 'cat', title: 'My cat', set: { species: 'cat' } },
          { id: 'other', title: 'Another pet', set: { species: 'pet' } },
        ],
      },
      next: { dog: 'pet-name', cat: 'pet-name', other: 'pet-name' },
    },
    {
      id: 'pet-name',
      type: 'input',
      data: { prompt: "What is your {{species}}'s name?", var: 'petName', kind: 'text' },
      next: REASON,
    },
    {
      id: REASON,
      type: 'list',
      data: {
        text: 'What is the visit for, {{user.firstName}}? If {{petName}} is struggling to breathe, bleeding or collapsed, choose *Emergency*.',
        footer: 'Clinic open 9 am – 9 pm · emergencies 24×7',
        button: 'Choose reason',
        sections: [
          {
            id: 'visit',
            title: 'Visit reasons',
            rows: CONCERNS.map((c) => ({ ...c, set: { concern: c.title } })),
          },
          {
            id: 'more',
            title: 'Something else',
            rows: [
              {
                id: 'describe',
                title: 'Describe symptoms',
                description: 'Tell us in your own words',
              },
              {
                id: 'emergency',
                title: 'Emergency',
                description: 'Breathing trouble, bleeding, poisoning, collapse',
              },
            ],
          },
        ],
      },
      next: {
        ...Object.fromEntries(CONCERNS.map((c) => [c.id, VET])),
        describe: 'describe',
        emergency: EMERGENCY,
      },
    },
    {
      id: 'describe',
      type: 'ai',
      data: {
        set: { symptom: '' },
        prompt:
          'Tell us what is going on — e.g. "Bruno has been scratching his ears and shaking his head since Sunday".',
        intents: [
          {
            id: 'emergency',
            description: 'Breathing trouble, heavy bleeding, poisoning, seizure, collapse',
          },
          { id: 'skin', description: 'Itching, ticks, fleas, hair loss, ear trouble or rashes' },
          { id: 'tummy', description: 'Vomiting, loose motion or not eating' },
          { id: 'pain', description: 'Limping, pain, an injury or stiffness' },
          { id: 'other', description: 'Any other health worry or a routine visit' },
        ],
        entities: [
          { name: 'symptom', kind: 'text', description: 'The main symptom in a few words' },
        ],
        retry: "Sorry, I couldn't quite follow that. Please pick the closest reason.",
      },
      next: {
        emergency: EMERGENCY,
        skin: 'noted',
        tummy: 'noted',
        pain: 'noted',
        other: 'noted',
        fallback: REASON,
      },
    },
    {
      id: 'noted',
      type: 'condition',
      data: { cases: [{ id: 'has', var: 'symptom', op: 'notEmpty' }] },
      next: { has: 'noted-text', else: 'noted-plain' },
    },
    {
      id: 'noted-text',
      type: 'text',
      data: {
        set: { concern: '{{symptom}}' },
        text: 'Thanks — noted *{{symptom}}* for the vet. Keep fresh water nearby, and do not give human medicines.',
      },
      next: VET,
    },
    {
      id: 'noted-plain',
      type: 'text',
      data: {
        set: { concern: 'General consultation' },
        text: 'Thanks. The vet will go through it with you at the visit.',
      },
      next: VET,
    },
    {
      id: EMERGENCY,
      type: 'cta',
      data: {
        header: 'Emergency — come in now',
        text: 'Our emergency team is in 24×7. Call us on the way so we are ready for {{petName}}. Keep your pet warm and still, and bring any packet if you suspect poisoning.',
        actions: [
          { kind: 'call', title: 'Call emergency', phone: CLINIC.emergency },
          { kind: 'url', title: 'Get directions', url: CLINIC.directions },
        ],
      },
      next: 'er-pin',
    },
    {
      id: 'er-pin',
      type: 'location',
      data: {
        location: { name: CLINIC.name, address: CLINIC.address, lat: CLINIC.lat, lng: CLINIC.lng },
        caption: 'Emergency entrance on Road No. 36. Parking right at the door.',
      },
      next: 'er-vet',
    },
    {
      id: 'er-vet',
      type: 'handoff',
      data: {
        agentName: VET_ON_CALL.agentName,
        text: "Hi {{user.firstName}}, I'm Dr. Farah, the vet on call. Tell me quickly what happened to {{petName}} — I'll guide you while you drive.",
      },
      next: 'er-end',
    },
    {
      id: 'er-end',
      type: 'end',
      data: { showMenu: true },
    },
    {
      id: VET,
      type: 'list',
      data: {
        text: 'Choose a vet for {{petName}}. The fee covers the exam and one free follow-up within 7 days.',
        footer: 'Fees in ₹, paid online when you book',
        button: 'Choose vet',
        sections: [{ id: 'vets', title: 'Our vets', rows: VETS.map(vetRow) }],
      },
      next: Object.fromEntries(VETS.map((v) => [v.id, 'profile'])),
    },
    {
      id: 'profile',
      type: 'image',
      data: {
        image: { icon: 'pet', accent: 'orange', title: '{{vet}}', subtitle: '{{vetQual}}' },
        caption: '{{vet}} — consultation {{fee|money}}. Languages: English, Telugu, Hindi.',
      },
      next: 'mode',
    },
    {
      id: 'mode',
      type: 'buttons',
      data: {
        text: 'Clinic visit or video consult? Video works well for skin, diet and behaviour questions.',
        buttons: [
          {
            id: 'clinic',
            title: 'Clinic visit',
            set: { mode: 'clinic', modeLabel: 'Clinic visit' },
          },
          {
            id: 'video',
            title: 'Video consult',
            set: { mode: 'video', modeLabel: 'Video consult' },
          },
        ],
      },
      next: { clinic: DAY, video: DAY },
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day suits you to see {{vet}}?',
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
        text: 'Free slots with {{vet}} on {{dayLabel}} (IST):',
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
          to: 21,
          stepMin: 30,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 'review', 'other-day': DAY },
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check your booking',
        text: '*Pet:* {{petName}} ({{species}})\n*Reason:* {{concern}}\n*Vet:* {{vet}}\n*Type:* {{modeLabel}}\n*When:* {{dayLabel}} at {{slot|time}}\n*Fee:* {{fee|money}}',
        footer: 'Free cancellation up to 2 hours before',
        buttons: [
          { id: 'confirm', title: 'Confirm & pay' },
          { id: 'change', title: 'Change time' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'summary', change: DAY, cancel: 'not-booked' },
    },
    {
      id: 'summary',
      type: 'order',
      data: {
        set: { orderId: '$id:PAY' },
        order: {
          orderId: '{{orderId}}',
          title: 'Vet consultation',
          items: [{ id: 'consult', name: '{{modeLabel}} — {{vet}}', qty: 1, price: '{{fee}}' }],
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
          items: [{ id: 'consult', name: '{{modeLabel}} — {{vet}}', qty: 1, price: '{{fee}}' }],
          status: 'paid',
        },
      },
      next: 'ticket',
    },
    {
      id: 'ticket',
      type: 'ticket',
      data: {
        set: { bookingId: '$id:PP', token: '$int:5:40' },
        complete: true,
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Vet appointment confirmed',
          subtitle: 'PawPal Pet Clinic, Jubilee Hills',
          fields: [
            { label: 'Pet', value: '{{petName}}' },
            { label: 'Parent', value: '{{user.fullName}}' },
            { label: 'Vet', value: '{{vet}}' },
            { label: 'Type', value: '{{modeLabel}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Token', value: 'P-{{token}}' },
          ],
          qrData: 'pawpal://visit/{{bookingId}}?slot={{slot}}',
        },
        caption:
          'Show this QR at reception. Bring {{petName}}’s vaccination card and any earlier reports.',
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Add the visit to your calendar, or call the clinic if you need us.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: '{{petName}} — {{vet}}',
              start: '{{slot}}',
              durationMin: 30,
              location: CLINIC.address,
            },
          },
          { kind: 'call', title: 'Call clinic', phone: CLINIC.phone },
        ],
      },
      next: 'mode-check',
    },
    {
      id: 'mode-check',
      type: 'condition',
      data: { cases: [{ id: 'video', var: 'mode', op: 'eq', value: 'video' }] },
      next: { video: 'video-link', else: 'pin' },
    },
    {
      id: 'video-link',
      type: 'cta',
      data: {
        text: 'Join from this link at {{slot|time}}. Keep {{petName}} in a well-lit spot so the vet can see clearly.',
        actions: [{ kind: 'url', title: 'Join video consult', url: CLINIC.video }],
      },
      next: 'remind',
    },
    {
      id: 'pin',
      type: 'location',
      data: {
        location: { name: CLINIC.name, address: CLINIC.address, lat: CLINIC.lat, lng: CLINIC.lng },
        caption:
          'Please keep dogs on a leash and cats in a carrier — we have separate cat and dog waiting areas.',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: { afterMs: 20_000, label: 'Vet visit reminder', note: 'Real use: the day before.' },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: { text: 'All set! Give {{petName}} a pat from us.', showMenu: true },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Vet visit reminder',
        text: "Reminder: {{petName}}'s {{modeLabel}} with {{vet}} is tomorrow at {{slot|time}}. Booking {{bookingId}}.",
        buttons: [
          { id: 'confirm', title: 'Confirm' },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'r-ok', reschedule: 're-day', cancel: 'r-cancel' },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: { text: 'Thank you. See you and {{petName}} tomorrow.', showMenu: true },
    },
    {
      id: 're-day',
      type: 'list',
      data: {
        text: 'Pick a new day — your payment carries over.',
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
        text: 'Free slots on {{dayLabel}}:',
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
        text: "Done — {{petName}}'s visit is now on {{dayLabel}} at {{slot|time}}.",
        showMenu: true,
      },
    },
    {
      id: 'r-cancel',
      type: 'buttons',
      data: {
        text: 'Cancel booking {{bookingId}}? {{fee|money}} goes back to your original payment method in 5–7 working days.',
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
      data: { text: 'Cancelled. Refund reference: {{refundId}}.', showMenu: true },
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
