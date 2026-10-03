/**
 * Dental appointment: service → (toothache: free-text pain triage through an `ai` node, with
 * a button fallback; swelling or injury goes to the urgent line) → dentist → day → slot →
 * patient → review → pay (consultation + the first-visit X-ray or add-on) → QR ticket,
 * calendar, map pin and a reminder.
 */
import { defineWorkflow } from '../../author';
import { CLINIC, DENTAL_SERVICES, FRONT_DESK } from './data';
import { patientNodes, slotPicker } from './shared';

const DENTIST = 'dentist';
const REVIEW = 'review';
const SOS = 'sos';
const PRIORITY = 'priority';
const MILD = 'mild';

export const dental = defineWorkflow({
  key: 'dental',
  name: 'Dental appointment',
  description: 'Check-ups, toothache, aligners, implants and kids',
  keywords: ['dentist', 'dental', 'tooth', 'teeth', 'toothache', 'root canal', 'braces'],
  nodes: [
    {
      id: 'service',
      type: 'list',
      data: {
        header: 'Aura Smile Studio',
        text: 'Hi {{user.firstName}}, what would you like to see the dentist for?',
        footer: 'Dental chairs Mon–Sat, 10 am – 8 pm',
        button: 'Dental services',
        sections: [
          {
            id: 'dental',
            title: 'Dental care',
            rows: DENTAL_SERVICES.map((s) => ({
              id: s.id,
              title: s.title,
              description: s.description,
              set: {
                service: s.title,
                serviceKey: s.id,
                dentist: s.dentist,
                dentistQual: s.dentistQual,
                fee: String(s.fee),
                extraName: s.extraName,
                extraPrice: String(s.extraPrice),
                chair: s.chair,
                priority: 'Regular',
              },
            })),
          },
        ],
      },
      next: Object.fromEntries(DENTAL_SERVICES.map((s) => [s.id, 'route'])),
    },
    {
      id: 'route',
      type: 'condition',
      data: {
        note: 'Toothache is triaged first; everything else goes straight to the dentist.',
        cases: [{ id: 'pain', var: 'serviceKey', op: 'eq', value: 'toothache' }],
      },
      next: { pain: 'pain', else: DENTIST },
    },
    {
      id: 'pain',
      type: 'ai',
      data: {
        prompt:
          'Sorry you are in pain, {{user.firstName}}. Tell us about it in your own words — for example "lower left molar, throbbing since 2 days, cheek is a bit swollen".',
        intents: [
          {
            id: 'emergency',
            description:
              'Facial or jaw swelling, fever, a knocked-out or broken tooth after an injury, bleeding that will not stop, or trouble opening the mouth or swallowing',
          },
          {
            id: 'severe',
            description:
              'Strong or throbbing pain, pain that wakes them at night, painkillers barely help',
          },
          {
            id: 'mild',
            description:
              'Sensitivity to cold or sweet, an occasional twinge, a lost filling without pain',
          },
        ],
        entities: [
          { name: 'tooth', kind: 'text', description: 'Which tooth or side of the mouth, if said' },
          {
            name: 'since_when',
            kind: 'text',
            description: 'When the pain started, e.g. "since Sunday"',
          },
          { name: 'pain_score', kind: 'number', description: 'Pain from 1 to 10, if given' },
        ],
        retry: 'Sorry, I could not quite follow that. Please pick the closest option.',
      },
      next: { emergency: SOS, severe: PRIORITY, mild: 'score', fallback: 'pain-btn' },
    },
    {
      id: 'score',
      type: 'condition',
      data: {
        note: 'A pain score above 7 gets a same-day chair even when it sounds mild.',
        cases: [{ id: 'high', var: 'pain_score', op: 'gt', value: '7' }],
      },
      next: { high: PRIORITY, else: MILD },
    },
    {
      id: 'pain-btn',
      type: 'buttons',
      data: {
        text: 'Which is closest to how it feels?',
        buttons: [
          { id: 'swelling', title: 'Swelling or injury' },
          { id: 'severe', title: 'Severe pain' },
          { id: 'mild', title: 'Mild sensitivity' },
        ],
      },
      next: { swelling: SOS, severe: PRIORITY, mild: MILD },
    },
    {
      id: SOS,
      type: 'cta',
      data: {
        header: 'Please come in today',
        text: 'Swelling, fever or an injured tooth needs to be seen today. Call our urgent dental line — the dentist on duty will see you between appointments. If a tooth was knocked out, keep it in milk and come within an hour.',
        actions: [
          { kind: 'call', title: 'Call urgent line', phone: CLINIC.urgent },
          { kind: 'url', title: 'Clinic website', url: CLINIC.website },
        ],
      },
      next: 'sos-pin',
    },
    {
      id: 'sos-pin',
      type: 'location',
      data: {
        location: { name: CLINIC.name, address: CLINIC.address, lat: CLINIC.lat, lng: CLINIC.lng },
        caption: 'Tell the front desk it is a dental emergency — you will not need a booking.',
      },
      next: 'sos-agent',
    },
    {
      id: 'sos-agent',
      type: 'handoff',
      data: {
        complete: true,
        agentName: 'Dr. Kabir Malhotra (Dentist on duty)',
        text: 'Hi {{user.firstName}}, Dr. Kabir here. I have read your message. Are you able to come to Bandra within the next hour? Meanwhile a cold compress on the cheek will help — please do not put heat on it.',
      },
      next: 'sos-end',
    },
    {
      id: 'sos-end',
      type: 'end',
      data: { showMenu: true },
    },
    {
      id: PRIORITY,
      type: 'text',
      data: {
        set: { priority: 'Same-day priority' },
        text: 'We keep two chairs free every day for patients in pain. Pick the earliest slot below and {{dentist}} will relieve the pain at the first visit.',
      },
      next: DENTIST,
    },
    {
      id: MILD,
      type: 'text',
      data: {
        text: 'That sounds like sensitivity, which is very treatable. Until your visit, brush with a sensitivity toothpaste twice a day and avoid very cold drinks.',
      },
      next: DENTIST,
    },
    {
      id: DENTIST,
      type: 'image',
      data: {
        image: { icon: 'tooth', accent: 'cyan', title: '{{dentist}}', subtitle: '{{dentistQual}}' },
        caption:
          '*{{service}}* with {{dentist}} in the {{chair}}.\nConsultation {{fee|money}} · {{extraName}} {{extraPrice|money}} if needed at the first visit.',
      },
      next: 'day',
    },
    ...slotPicker({
      day: 'day',
      slot: 'slot',
      next: 'who',
      dayText: 'Which day suits you for {{service}}? We are closed on Sundays.',
      slotText:
        'Free chairs with {{dentist}} on {{dayLabel}} (IST). A first visit takes about 30 minutes.',
      stepMin: 30,
    }),
    ...patientNodes(REVIEW, 'dental visit'),
    {
      id: REVIEW,
      type: 'buttons',
      data: {
        header: 'Check your booking',
        text: '*Patient:* {{patientName}}\n*Mobile:* {{patientPhone}}\n*For:* {{service}} ({{priority}})\n*Dentist:* {{dentist}}\n*When:* {{dayLabel}} at {{slot|time}}\n*Where:* {{chair}}\n*Pay now:* {{fee|money}} + {{extraName}} {{extraPrice|money}}',
        footer: 'Treatment costs are quoted after the check-up',
        buttons: [
          { id: 'confirm', title: 'Confirm & pay' },
          { id: 'change', title: 'Change time' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'summary', change: 'day', cancel: 'not-booked' },
    },
    {
      id: 'summary',
      type: 'order',
      data: {
        set: { orderId: '$id:ADP', plan: '$price:200:20' },
        order: {
          orderId: '{{orderId}}',
          title: 'Dental visit',
          items: [
            { id: 'consult', name: 'Consultation — {{dentist}}', qty: 1, price: '{{fee}}' },
            { id: 'extra', name: '{{extraName}}', qty: 1, price: '{{extraPrice}}' },
          ],
          adjustments: [{ id: 'plan', label: 'Aura Smile Plan saving', amount: '-{{plan}}' }],
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
        set: { bookingId: '$id:ADN' },
        order: {
          orderId: '{{orderId}}',
          title: 'Payment received',
          items: [
            { id: 'consult', name: 'Consultation — {{dentist}}', qty: 1, price: '{{fee}}' },
            { id: 'extra', name: '{{extraName}}', qty: 1, price: '{{extraPrice}}' },
          ],
          adjustments: [{ id: 'plan', label: 'Aura Smile Plan saving', amount: '-{{plan}}' }],
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
          title: 'Dental visit confirmed',
          subtitle: 'Aura Smile Studio · Bandra West',
          fields: [
            { label: 'Patient', value: '{{patientName}}' },
            { label: 'For', value: '{{service}}' },
            { label: 'Dentist', value: '{{dentist}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Chair', value: '{{chair}}' },
            { label: 'Priority', value: '{{priority}}' },
          ],
          qrData: 'aura://dental/{{bookingId}}?slot={{slot}}',
        },
        caption:
          'Show this QR at reception. Please arrive 10 minutes early to fill in your medical history.',
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Add the visit to your calendar, or call us if anything changes.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: '{{service}} — {{dentist}}',
              start: '{{slot}}',
              durationMin: 30,
              location: CLINIC.address,
            },
          },
          { kind: 'call', title: 'Call the clinic', phone: CLINIC.phone },
        ],
      },
      next: 'pin',
    },
    {
      id: 'pin',
      type: 'location',
      data: {
        location: { name: CLINIC.name, address: CLINIC.address, lat: CLINIC.lat, lng: CLINIC.lng },
        caption: 'The Smile Studio is on the 2nd floor, to the right of reception.',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: { afterMs: 20_000, label: 'Dental visit reminder', note: 'Real use: the day before.' },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'All set, {{user.firstName}}. We will remind you the day before.',
        showMenu: true,
      },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Dental visit tomorrow',
        text: 'Reminder: {{service}} with {{dentist}} tomorrow at {{slot|time}} (booking {{bookingId}}).\n• Bring any old X-rays and your list of medicines\n• Tell us if you take blood thinners or are pregnant\n• Eat a light meal before you come',
        buttons: [
          { id: 'confirm', title: 'I’ll be there' },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'help', title: 'Talk to us' },
        ],
      },
      next: { confirm: 'r-ok', reschedule: 're-day', help: 'desk' },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: { text: 'Thank you, {{user.firstName}}. See you tomorrow.', showMenu: true },
    },
    ...slotPicker({
      day: 're-day',
      slot: 're-slot',
      next: 're-done',
      dayText: 'Pick a new day — your payment carries over.',
      slotText: 'Free chairs on {{dayLabel}}:',
      stepMin: 30,
    }),
    {
      id: 're-done',
      type: 'end',
      data: {
        text: 'Done — moved to {{dayLabel}} at {{slot|time}}. Booking {{bookingId}} stays the same.',
        showMenu: true,
      },
    },
    {
      id: 'desk',
      type: 'handoff',
      data: {
        agentName: FRONT_DESK.agentName,
        text: 'Hi {{user.firstName}}, Rhea from the front desk. I can see booking {{bookingId}} with {{dentist}}. How can I help?',
      },
      next: 'desk-end',
    },
    {
      id: 'desk-end',
      type: 'end',
      data: { showMenu: true },
    },
    {
      id: 'not-booked',
      type: 'end',
      data: { text: 'No booking was made. Start again from the menu any time.', showMenu: true },
    },
  ],
});
