/**
 * Personal training: trainer carousel → session pack → injuries and limits read by `ai` →
 * first session day → slot → order → pay → QR booking, trainer card, calendar → a reminder
 * push the day before to confirm, reschedule or cancel.
 */
import { defineWorkflow } from '../../author';
import type { Product } from '../../schema';
import { rupees } from '../healthcare/data';
import { BRANCHES, PT_DESK, PT_PACKS, TRAINERS, type Trainer } from './data';

const PACK = 'pack';
const DAY = 'day';
const HOME_BRANCH = BRANCHES[0];

function trainerCard(trainer: Trainer): Product {
  return {
    id: trainer.id,
    title: trainer.name,
    subtitle: `${trainer.speciality} · ${trainer.cert} · ${trainer.years} yrs`,
    price: trainer.rate,
    badge: trainer.badge,
    image: { icon: 'fitness', accent: 'red', title: trainer.name, subtitle: trainer.cert },
    buttonTitle: 'Train with me',
    set: { trainer: trainer.name, trainerFocus: trainer.speciality },
  };
}

export const personalTraining = defineWorkflow({
  key: 'personal-training',
  name: 'Personal training',
  description: '1-on-1 sessions with a certified coach',
  keywords: ['personal training', 'personal trainer', 'pt', 'coach', 'trainer'],
  nodes: [
    {
      id: 'trainers',
      type: 'carousel',
      data: {
        text: 'Meet our coaches, {{user.firstName}}. Every pack starts with a fitness assessment and a plan built around you. Price shown per single session.',
        cards: TRAINERS.map(trainerCard),
      },
      next: Object.fromEntries(TRAINERS.map((t) => [t.id, PACK])),
    },
    {
      id: PACK,
      type: 'list',
      data: {
        text: 'How many sessions with {{trainer}}? Bigger packs save more, and sessions never expire for 90 days.',
        button: 'Choose pack',
        sections: [
          {
            id: 'packs',
            title: 'Session packs',
            rows: PT_PACKS.map((p) => ({
              id: p.id,
              title: p.title,
              description: `${p.description} · ${rupees(p.price)}`,
              set: { pack: p.title, packPrice: String(p.price), sessions: String(p.sessions) },
            })),
          },
        ],
      },
      next: Object.fromEntries(PT_PACKS.map((p) => [p.id, 'limits'])),
    },
    {
      id: 'limits',
      type: 'ai',
      data: {
        set: { injury: 'None' },
        prompt:
          'Any injuries, pain or medical conditions {{trainer}} should know about? e.g. "lower back pain, had knee surgery in 2022". Type *none* if not.',
        intents: [
          { id: 'injury', description: 'An injury, pain, surgery or medical condition' },
          { id: 'none', description: 'No injuries or conditions' },
        ],
        entities: [
          { name: 'injury', kind: 'text', description: 'The injury or condition in a few words' },
        ],
        retry: 'Thanks — your coach will go through it at the assessment.',
      },
      next: { injury: 'has-injury', none: DAY, fallback: DAY },
    },
    {
      id: 'has-injury',
      type: 'condition',
      data: { cases: [{ id: 'none', var: 'injury', op: 'eq', value: 'None' }] },
      next: { none: DAY, else: 'injury-note' },
    },
    {
      id: 'injury-note',
      type: 'notice',
      data: {
        text: 'Noted for {{trainer}}: {{injury}}. Your first session starts with a mobility check, and we may ask for a doctor’s note.',
      },
      next: DAY,
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'When should your first session with {{trainer}} be?',
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
        text: "{{trainer}}'s free slots on {{dayLabel}} (60 minutes each):",
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
          from: 6,
          to: 21,
          stepMin: 60,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 'summary', 'other-day': DAY },
    },
    {
      id: 'summary',
      type: 'order',
      data: {
        set: { orderId: '$id:PT' },
        order: {
          orderId: '{{orderId}}',
          title: 'Personal training — {{trainer}}',
          items: [{ id: 'pack', name: '{{pack}}', qty: 1, price: '{{packPrice}}' }],
          adjustments: [{ id: 'assessment', label: 'Fitness assessment', amount: 0 }],
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
          items: [{ id: 'pack', name: '{{pack}}', qty: 1, price: '{{packPrice}}' }],
          adjustments: [{ id: 'assessment', label: 'Fitness assessment', amount: 0 }],
          status: 'paid',
        },
      },
      next: 'ticket',
    },
    {
      id: 'ticket',
      type: 'ticket',
      data: {
        set: { ptId: '$id:PTB' },
        complete: true,
        ticket: {
          ticketId: '{{ptId}}',
          title: 'First session booked',
          subtitle: '{{trainer}} · {{trainerFocus}}',
          fields: [
            { label: 'Member', value: '{{user.fullName}}' },
            { label: 'Pack', value: '{{pack}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Branch', value: HOME_BRANCH.name },
            { label: 'Health notes', value: '{{injury}}' },
          ],
          qrData: 'fitnation://pt/{{ptId}}?slot={{slot}}',
        },
        caption: 'Scan at the turnstile; {{trainer}} will meet you at the PT zone.',
      },
      next: 'coach',
    },
    {
      id: 'coach',
      type: 'contact',
      data: {
        contact: {
          name: '{{trainer}}',
          phone: PT_DESK.phone,
          role: 'Personal trainer',
          organisation: 'FitNation',
        },
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Save your first session. Come 10 minutes early for the assessment.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: 'PT session — {{trainer}}',
              start: '{{slot}}',
              durationMin: 60,
              location: HOME_BRANCH.address,
            },
          },
          { kind: 'call', title: 'Call PT desk', phone: PT_DESK.phone },
        ],
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'PT session tomorrow',
        note: 'Real use: the evening before.',
      },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: { text: "You're booked, {{user.firstName}}. Sleep well and hydrate!", showMenu: true },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Session tomorrow',
        text: 'Reminder: your session with {{trainer}} is tomorrow at {{slot|time}}. Eat a light snack 60–90 minutes before.',
        buttons: [
          { id: 'confirm', title: "I'll be there" },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'cancel', title: 'Cancel session' },
        ],
      },
      next: { confirm: 'r-ok', reschedule: 're-day', cancel: 'r-cancel' },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: { text: 'Great — {{trainer}} will see you at {{slot|time}}.', showMenu: true },
    },
    {
      id: 're-day',
      type: 'list',
      data: {
        text: 'Pick a new day — the session stays in your pack.',
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
        text: "{{trainer}}'s free slots on {{dayLabel}}:",
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
          from: 6,
          to: 21,
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
      data: { text: 'Done — moved to {{dayLabel}} at {{slot|time}}.', showMenu: true },
    },
    {
      id: 'r-cancel',
      type: 'end',
      data: {
        text: 'Cancelled. The session goes back into your pack — book it again from the menu whenever you are ready.',
        showMenu: true,
      },
    },
  ],
});
