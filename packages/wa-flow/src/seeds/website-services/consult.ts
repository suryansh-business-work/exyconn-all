/**
 * Free consultation: topic (kept when another workflow already chose one) → day → slot →
 * meeting format → confirm → a booking pass with a QR, the office pin for in-person meetings,
 * an add-to-calendar action, and a "starts in 15 minutes" push with the join link.
 */
import { defineWorkflow } from '../../author';
import { bookingNodes } from './consult-booking';
import { SERVICES } from './data';
import { MEET_MODES } from './options';

const TOPIC = 'topic-list';
const DAY = 'day';
const CONFIRM = 'confirm';

export const consult = defineWorkflow({
  key: 'consult',
  name: 'Book a consultation',
  description: 'A free 30-minute call with a solution architect',
  keywords: ['consultation', 'book a call', 'meeting', 'schedule a call', 'talk to an expert'],
  nodes: [
    {
      id: 'has-topic',
      type: 'condition',
      data: { cases: [{ id: 'known', var: 'topic', op: 'notEmpty' }] },
      next: { known: 'topic-ok', else: TOPIC },
    },
    {
      id: 'topic-ok',
      type: 'buttons',
      data: {
        text: 'Shall we book your free consultation about *{{topic}}*?',
        buttons: [
          { id: 'yes', title: 'Yes, pick a time' },
          { id: 'other', title: 'Different topic' },
        ],
      },
      next: { yes: DAY, other: TOPIC },
    },
    {
      id: TOPIC,
      type: 'list',
      data: {
        header: 'Free consultation',
        text: 'Thirty minutes with a solution architect — you leave with a clear plan, whether or not you work with us. What would you like to discuss?',
        button: 'Choose topic',
        sections: [
          {
            id: 'topics',
            title: 'Topics',
            rows: [
              ...SERVICES.map((s) => ({ id: s.id, title: s.name, set: { topic: s.name } })),
              {
                id: 'unsure',
                title: 'Not sure yet',
                description: 'We will help you shape the idea',
                set: { topic: 'Shaping your idea' },
              },
            ],
          },
        ],
      },
      next: Object.fromEntries([...SERVICES.map((s) => s.id), 'unsure'].map((id) => [id, DAY])),
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day suits you? All times are IST.',
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
        text: 'Free slots with our architects on {{dayLabel}}:',
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
          to: 19,
          stepMin: 30,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 'mode', 'other-day': DAY },
    },
    {
      id: 'mode',
      type: 'buttons',
      data: {
        text: 'How would you like to meet?',
        buttons: MEET_MODES.map((m) => ({
          id: m.id,
          title: m.title,
          set: { meetMode: m.id, meetLabel: m.label },
        })),
      },
      next: Object.fromEntries(MEET_MODES.map((m) => [m.id, CONFIRM])),
    },
    {
      id: CONFIRM,
      type: 'buttons',
      data: {
        text: 'Please confirm:\n*{{topic}}*\n{{dayLabel}} at {{slot|time}} IST · 30 minutes\n{{meetLabel}}\nInvite to {{user.email}}',
        buttons: [
          { id: 'ok', title: 'Confirm' },
          { id: 'change', title: 'Change time' },
        ],
      },
      next: { ok: 'pass', change: DAY },
    },
    ...bookingNodes,
  ],
});
