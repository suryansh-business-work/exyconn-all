/**
 * Yoga class booking: style → class card → studio or live online → drop-in or a pass → day →
 * batch → order → pay → QR ticket or join link, map pin, calendar → an "in one hour" push to
 * confirm or release the spot.
 */
import { defineWorkflow } from '../../author';
import { BRANCHES, GYM, YOGA_CLASSES, YOGA_PASSES, type YogaClass } from './data';

const DAY = 'day';
const STUDIO = BRANCHES.find((b) => b.id === 'bandra') ?? BRANCHES[0];

function classRow(item: YogaClass) {
  return {
    id: item.id,
    title: item.title,
    description: `${item.description} · ${item.level} · ${item.minutes} min`,
    set: {
      yoga: item.title,
      yogaPrice: String(item.price),
      yogaMins: String(item.minutes),
      yogaLevel: item.level,
    },
  };
}

export const yoga = defineWorkflow({
  key: 'yoga',
  name: 'Yoga classes',
  description: 'Book a studio or live online yoga class',
  keywords: ['yoga', 'yoga class', 'meditation', 'pranayama', 'stretch'],
  nodes: [
    {
      id: 'style',
      type: 'list',
      data: {
        header: 'Yoga at FitNation',
        text: 'Namaste {{user.firstName}} 🙏 Which class would you like? Mats, blocks and straps are provided at the studio.',
        footer: 'Drop-in prices shown · passes on the next step',
        button: 'View classes',
        sections: [{ id: 'classes', title: 'Classes', rows: YOGA_CLASSES.map(classRow) }],
      },
      next: Object.fromEntries(YOGA_CLASSES.map((c) => [c.id, 'class-card'])),
    },
    {
      id: 'class-card',
      type: 'product',
      data: {
        product: {
          id: 'chosen-class',
          title: '{{yoga}}',
          subtitle: '{{yogaLevel}} · {{yogaMins}} minutes',
          price: '{{yogaPrice}}',
          image: { icon: 'spa', accent: 'purple', title: '{{yoga}}' },
        },
      },
      next: 'mode',
    },
    {
      id: 'mode',
      type: 'buttons',
      data: {
        text: 'Join at the Bandra studio, or live from home?',
        buttons: [
          {
            id: 'studio',
            title: 'At the studio',
            set: { mode: 'studio', modeLabel: 'Bandra studio' },
          },
          { id: 'online', title: 'Live online', set: { mode: 'online', modeLabel: 'Live online' } },
        ],
      },
      next: { studio: 'pass', online: 'pass' },
    },
    {
      id: 'pass',
      type: 'buttons',
      data: {
        set: {
          tenPrice: String(YOGA_PASSES.tenClass.price),
          unlimitedPrice: String(YOGA_PASSES.unlimited.price),
        },
        text: 'How would you like to pay?\n• Drop-in: {{yogaPrice|money}}\n• 10 classes in 60 days: {{tenPrice|money}}\n• Unlimited classes for 30 days: {{unlimitedPrice|money}}',
        footer: 'Passes work for every class, studio or online',
        buttons: [
          {
            id: 'drop-in',
            title: 'Drop-in',
            set: { passName: 'Drop-in: {{yoga}}', passPrice: '{{yogaPrice}}' },
          },
          {
            id: 'ten',
            title: YOGA_PASSES.tenClass.title,
            set: {
              passName: YOGA_PASSES.tenClass.label,
              passPrice: String(YOGA_PASSES.tenClass.price),
            },
          },
          {
            id: 'unlimited',
            title: YOGA_PASSES.unlimited.title,
            set: {
              passName: YOGA_PASSES.unlimited.label,
              passPrice: String(YOGA_PASSES.unlimited.price),
            },
          },
        ],
      },
      next: { 'drop-in': DAY, ten: DAY, unlimited: DAY },
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day for {{yoga}}?',
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
        text: '{{yoga}} batches on {{dayLabel}} (IST). 20 spots per batch.',
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
          from: 6,
          to: 20,
          stepMin: 90,
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
        set: { orderId: '$id:YG' },
        order: {
          orderId: '{{orderId}}',
          title: '{{yoga}} · {{modeLabel}}',
          items: [{ id: 'pass', name: '{{passName}}', qty: 1, price: '{{passPrice}}' }],
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
          items: [{ id: 'pass', name: '{{passName}}', qty: 1, price: '{{passPrice}}' }],
          status: 'paid',
        },
      },
      next: 'ticket',
    },
    {
      id: 'ticket',
      type: 'ticket',
      data: {
        set: { yogaId: '$id:YB', spot: '$int:1:20' },
        complete: true,
        ticket: {
          ticketId: '{{yogaId}}',
          title: 'Class booked',
          subtitle: '{{yoga}} · {{modeLabel}}',
          fields: [
            { label: 'Member', value: '{{user.fullName}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Length', value: '{{yogaMins}} min' },
            { label: 'Mat spot', value: '{{spot}}' },
            { label: 'Plan', value: '{{passName}}' },
          ],
          qrData: 'fitnation://yoga/{{yogaId}}?slot={{slot}}',
        },
        caption:
          'Scan at the studio door. Doors close 5 minutes after the start, so come a little early.',
      },
      next: 'mode-check',
    },
    {
      id: 'mode-check',
      type: 'condition',
      data: { cases: [{ id: 'online', var: 'mode', op: 'eq', value: 'online' }] },
      next: { online: 'join', else: 'pin' },
    },
    {
      id: 'join',
      type: 'cta',
      data: {
        text: 'Join from this link at {{slot|time}}. Keep your camera on if you would like the teacher to correct your posture.',
        actions: [{ kind: 'url', title: 'Join live class', url: GYM.online }],
      },
      next: 'calendar',
    },
    {
      id: 'pin',
      type: 'location',
      data: {
        location: { name: STUDIO.name, address: STUDIO.address, lat: STUDIO.lat, lng: STUDIO.lng },
        caption:
          'The yoga studio is on the 2nd floor. Shoes off at the door; changing rooms on the left.',
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Save the class to your calendar.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: '{{yoga}} — FitNation',
              start: '{{slot}}',
              durationMin: 60,
              location: '{{modeLabel}}',
            },
          },
        ],
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: { afterMs: 20_000, label: 'Class in one hour', note: 'Real use: one hour before.' },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: { text: 'See you on the mat, {{user.firstName}}!', showMenu: true },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Class in one hour',
        text: '{{yoga}} starts at {{slot|time}} ({{modeLabel}}). Avoid a heavy meal now and bring water.',
        buttons: [
          { id: 'coming', title: "I'm coming" },
          { id: 'skip', title: "Can't make it" },
        ],
      },
      next: { coming: 'r-ok', skip: 'r-skip' },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: { text: 'Lovely. Your mat spot {{spot}} is ready.', showMenu: true },
    },
    {
      id: 'r-skip',
      type: 'end',
      data: {
        text: 'Thanks for letting us know — your spot goes to the waitlist and the class credit is back on your pass.',
        showMenu: true,
      },
    },
  ],
});
