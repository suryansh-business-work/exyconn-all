/**
 * Consultation booking: practice area (kept when coming from case categories) → advocate card
 * → office, video or phone → day → slot → client → a one-line brief → confidentiality notice →
 * review → pay → QR ticket, calendar, office pin / video link / call note → reminder push.
 */
import { defineWorkflow } from '../../author';
import { rupees } from '../healthcare/data';
import { areaVars, FIRM, PRACTICE_AREAS } from './data';

const AREA = 'area';
const PROFILE = 'profile';
const DAY = 'day';
const BRIEF = 'brief';

export const consultation = defineWorkflow({
  key: 'consultation',
  name: 'Book a consultation',
  description: 'Meet an advocate in office, on video or by phone',
  keywords: ['consultation', 'consult', 'lawyer', 'advocate', 'legal advice', 'appointment'],
  nodes: [
    {
      id: 'has-area',
      type: 'condition',
      data: {
        note: 'Coming from case categories, the area is already chosen.',
        cases: [{ id: 'yes', var: 'areaKey', op: 'notEmpty' }],
      },
      next: { yes: 'keep-area', else: AREA },
    },
    {
      id: 'keep-area',
      type: 'buttons',
      data: {
        text: 'Shall we book you with {{lawyer}} for your {{area}} matter?',
        buttons: [
          { id: 'yes', title: 'Yes, continue' },
          { id: 'other', title: 'Another area' },
        ],
      },
      next: { yes: PROFILE, other: AREA },
    },
    {
      id: AREA,
      type: 'list',
      data: {
        header: 'Book a consultation',
        text: 'Hi {{user.firstName}}, what is your matter about? Each area is led by a senior advocate.',
        footer: 'First consultation fees in ₹',
        button: 'Practice areas',
        sections: [
          {
            id: 'areas',
            title: 'Practice areas',
            rows: PRACTICE_AREAS.map((a) => ({
              id: a.key,
              title: a.name,
              description: `${a.description} · ${rupees(a.fee)}`,
              set: areaVars(a),
            })),
          },
        ],
      },
      next: Object.fromEntries(PRACTICE_AREAS.map((a) => [a.key, PROFILE])),
    },
    {
      id: PROFILE,
      type: 'image',
      data: {
        image: {
          icon: 'legal',
          accent: 'indigo',
          title: '{{lawyer}}',
          subtitle: '{{lawyerTitle}}',
        },
        caption:
          '{{lawyer}} leads our {{area}} practice. First consultation: {{fee|money}} for 45 minutes, adjusted against fees if you engage us.',
      },
      next: 'mode',
    },
    {
      id: 'mode',
      type: 'buttons',
      data: {
        text: 'How would you like to meet?',
        buttons: [
          {
            id: 'office',
            title: 'At the office',
            set: { mode: 'office', modeLabel: 'In person, Saket office' },
          },
          { id: 'video', title: 'Video call', set: { mode: 'video', modeLabel: 'Video call' } },
          { id: 'phone', title: 'Phone call', set: { mode: 'phone', modeLabel: 'Phone call' } },
        ],
      },
      next: { office: DAY, video: DAY, phone: DAY },
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day suits you to speak with {{lawyer}}?',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, skipSundays: true, var: 'day' },
      },
      next: { pick: 'slot' },
    },
    {
      id: 'slot',
      type: 'list',
      data: {
        text: "{{lawyer}}'s free slots on {{dayLabel}} (IST):",
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
          to: 18,
          stepMin: 60,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 'client', 'other-day': DAY },
    },
    {
      id: 'client',
      type: 'buttons',
      data: {
        text: 'Is the consultation for you ({{user.fullName}}), or on behalf of someone else?',
        buttons: [
          { id: 'self', title: 'For me', set: { clientName: '{{user.fullName}}' } },
          { id: 'other', title: 'For someone else' },
        ],
      },
      next: { self: BRIEF, other: 'c-name' },
    },
    {
      id: 'c-name',
      type: 'input',
      data: { prompt: "The client's full name, please.", var: 'clientName', kind: 'name' },
      next: BRIEF,
    },
    {
      id: BRIEF,
      type: 'input',
      data: {
        prompt:
          'In a line or two, what would you like advice on? Avoid sensitive details here — the advocate will take them in the meeting.',
        var: 'brief',
        kind: 'text',
      },
      next: 'privacy',
    },
    {
      id: 'privacy',
      type: 'notice',
      data: {
        text: 'Everything you share with Lexora is confidential. We run a conflict check before the meeting and tell you at once if we cannot act.',
      },
      next: 'review',
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check your booking',
        text: '*Client:* {{clientName}}\n*Matter:* {{area}}\n*Brief:* {{brief}}\n*Advocate:* {{lawyer}}\n*How:* {{modeLabel}}\n*When:* {{dayLabel}} at {{slot|time}}\n*Fee:* {{fee|money}}',
        footer: 'Free rescheduling up to 4 hours before',
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
        set: { orderId: '$id:LX' },
        order: {
          orderId: '{{orderId}}',
          title: 'Legal consultation',
          items: [{ id: 'consult', name: '{{area}} — {{lawyer}}', qty: 1, price: '{{fee}}' }],
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
          items: [{ id: 'consult', name: '{{area}} — {{lawyer}}', qty: 1, price: '{{fee}}' }],
          status: 'paid',
        },
      },
      next: 'ticket',
    },
    {
      id: 'ticket',
      type: 'ticket',
      data: {
        set: { consultId: '$id:CN' },
        complete: true,
        ticket: {
          ticketId: '{{consultId}}',
          title: 'Consultation confirmed',
          subtitle: 'Lexora Legal Associates',
          fields: [
            { label: 'Client', value: '{{clientName}}' },
            { label: 'Matter', value: '{{area}}' },
            { label: 'Advocate', value: '{{lawyer}}' },
            { label: 'How', value: '{{modeLabel}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
          ],
          qrData: 'lexora://consult/{{consultId}}?slot={{slot}}',
        },
        caption:
          'Keep this for your records. Bring the documents you have — even partial ones help.',
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Add the consultation to your calendar, or call our front desk.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: 'Consultation — {{lawyer}}',
              start: '{{slot}}',
              durationMin: 45,
              location: '{{modeLabel}}',
            },
          },
          { kind: 'call', title: 'Call front desk', phone: FIRM.phone },
        ],
      },
      next: 'mode-check',
    },
    {
      id: 'mode-check',
      type: 'condition',
      data: {
        cases: [
          { id: 'video', var: 'mode', op: 'eq', value: 'video' },
          { id: 'phone', var: 'mode', op: 'eq', value: 'phone' },
        ],
      },
      next: { video: 'video-link', phone: 'phone-note', else: 'pin' },
    },
    {
      id: 'video-link',
      type: 'cta',
      data: {
        text: 'Join from this link at {{slot|time}}. Please use a quiet, private room.',
        actions: [{ kind: 'url', title: 'Join video call', url: FIRM.video }],
      },
      next: 'remind',
    },
    {
      id: 'phone-note',
      type: 'text',
      data: { text: '{{lawyer}} will call you at {{slot|time}} on your registered number.' },
      next: 'remind',
    },
    {
      id: 'pin',
      type: 'location',
      data: {
        location: { name: FIRM.name, address: FIRM.address, lat: FIRM.lat, lng: FIRM.lng },
        caption:
          'Fifth floor, DLF South Court. Visitor parking in the basement; Malviya Nagar metro is 10 minutes away.',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: { afterMs: 20_000, label: 'Consultation tomorrow', note: 'Real use: the day before.' },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'You are booked, {{user.firstName}}. We will remind you the day before.',
        showMenu: true,
      },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Consultation tomorrow',
        text: 'Reminder: your {{area}} consultation with {{lawyer}} is tomorrow at {{slot|time}} ({{modeLabel}}). Keep your documents and a list of questions handy.',
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
      data: { text: 'Thank you. Speak tomorrow at {{slot|time}}.', showMenu: true },
    },
    {
      id: 're-day',
      type: 'list',
      data: {
        text: 'Pick a new day — your payment carries over.',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, skipSundays: true, var: 'day' },
      },
      next: { pick: 're-slot' },
    },
    {
      id: 're-slot',
      type: 'list',
      data: {
        text: "{{lawyer}}'s free slots on {{dayLabel}}:",
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
          to: 18,
          stepMin: 60,
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
        text: 'Done — moved to {{dayLabel}} at {{slot|time}}. Booking {{consultId}} stays the same.',
        showMenu: true,
      },
    },
    {
      id: 'r-cancel',
      type: 'buttons',
      data: {
        text: 'Cancel consultation {{consultId}}? {{fee|money}} goes back to your original payment method in 5–7 working days.',
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
