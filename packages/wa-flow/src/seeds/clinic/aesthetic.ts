/**
 * Aesthetic treatment booking: treatment carousel → single session or package (injectables are
 * consult-only) → patch-test notice for lasers and peels → "when would you like to come?" read
 * by an `ai` node (e.g. "kal shaam 5 baje"; the fallback is the day list) → slot → review →
 * pay → QR ticket, pre-treatment instructions PDF and calendar → a reminder the day before,
 * and an aftercare push after the session that hands over to the aftercare check-in.
 */
import { defineWorkflow } from '../../author';
import type { Product } from '../../schema';
import { CLINIC, FRONT_DESK, PROCEDURES, TREATMENTS, type Treatment } from './data';
import { slotPicker } from './shared';

const PLAN_CHECK = 'plan-check';
const WHEN = 'when';
const DAY = 'day';
const SLOT = 'slot';
const REVIEW = 'review';
const ADVICE = 'advice';
const DESK = 'desk';

/** What picking a treatment stores, including the aftercare the check-in will need. */
export function chosen(item: Treatment) {
  const care = PROCEDURES.find((p) => p.id === item.aftercare);
  return {
    treatment: item.title,
    price: String(item.price),
    packagePrice: String(item.packagePrice),
    sessions: String(item.sessions),
    minutes: String(item.minutes),
    downtime: item.downtime,
    patchTest: item.patchTest,
    hasPackage: item.packagePrice > 0 ? 'yes' : 'no',
    procedure: care?.title ?? item.title,
    procKey: item.aftercare,
    normal: care?.normal ?? '',
    aftercare: care?.aftercare ?? '',
  };
}

function treatmentCard(item: Treatment): Product {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    price: item.price,
    mrp: item.mrp,
    badge: item.badge,
    image: { icon: item.icon, accent: 'pink', title: item.title },
    buttonTitle: item.packagePrice > 0 ? 'Book' : 'Book consult',
    set: chosen(item),
  };
}

export const aesthetic = defineWorkflow({
  key: 'aesthetic',
  name: 'Aesthetic treatments',
  description: 'Facials, peels, lasers, PRP and injectables',
  keywords: ['facial', 'hydrafacial', 'laser', 'peel', 'botox', 'filler', 'prp', 'treatment'],
  nodes: [
    {
      id: 'menu',
      type: 'carousel',
      data: {
        text: 'Hi {{user.firstName}}, every treatment at Aura is planned by a dermatologist and done by certified therapists. Swipe to choose one.',
        cards: [
          ...TREATMENTS.map(treatmentCard),
          {
            id: ADVICE,
            title: 'Not sure what you need?',
            subtitle: 'Chat with a skin therapist for a free recommendation',
            price: 0,
            badge: 'Free',
            image: { icon: 'chat', accent: 'slate', title: 'Ask a therapist' },
            buttonTitle: 'Ask a therapist',
          },
        ],
      },
      next: {
        ...Object.fromEntries(TREATMENTS.map((t) => [t.id, PLAN_CHECK])),
        [ADVICE]: ADVICE,
      },
    },
    {
      id: PLAN_CHECK,
      type: 'condition',
      data: {
        note: 'Injectables have no package: the first visit is a doctor consultation.',
        cases: [{ id: 'consult', var: 'hasPackage', op: 'eq', value: 'no' }],
      },
      next: { consult: 'consult-only', else: 'plan' },
    },
    {
      id: 'consult-only',
      type: 'text',
      data: {
        set: { planLabel: 'Doctor consultation', payPrice: '{{price}}', staff: 'Dr. Meghna Bhatt' },
        text: '*{{treatment}}* starts with a 30-minute consultation with Dr. Meghna Bhatt ({{price|money}}). She plans the doses and areas with you and gives a written quote; the fee is adjusted if you go ahead the same day.',
      },
      next: 'patch',
    },
    {
      id: 'plan',
      type: 'buttons',
      data: {
        header: '{{treatment}}',
        text: '*Single session:* {{price|money}} · {{minutes}} min\n*Package of {{sessions}}:* {{packagePrice|money}}\n*Downtime:* {{downtime}}\n\nMost people see the best results with the full package.',
        footer: 'Packages are valid for 12 months',
        buttons: [
          {
            id: 'single',
            title: 'Single session',
            set: { planLabel: 'Single session', payPrice: '{{price}}', staff: 'Senior therapist' },
          },
          {
            id: 'package',
            title: 'Full package',
            set: {
              planLabel: 'Package of {{sessions}} sessions',
              payPrice: '{{packagePrice}}',
              staff: 'Senior therapist',
            },
          },
          { id: 'question', title: 'Ask a question' },
        ],
      },
      next: { single: 'patch', package: 'patch', question: DESK },
    },
    {
      id: 'patch',
      type: 'condition',
      data: { cases: [{ id: 'needed', var: 'patchTest', op: 'eq', value: 'yes' }] },
      next: { needed: 'patch-note', else: WHEN },
    },
    {
      id: 'patch-note',
      type: 'notice',
      data: {
        text: 'First time with {{treatment}}? We do a free 5-minute patch test when you arrive and start once your skin is cleared.',
      },
      next: WHEN,
    },
    {
      id: WHEN,
      type: 'ai',
      data: {
        set: { when: '', whenMs: '' },
        note: 'Cleared on entry so an earlier answer is never reused.',
        prompt:
          'When would you like to come in? Type it the way you would say it — for example "kal shaam 5 baje", "Saturday morning" or "any weekday after 6".',
        intents: [
          { id: 'time', description: 'A specific day, with or without a time' },
          { id: 'flexible', description: 'Any time, no preference, or the earliest available' },
          {
            id: 'question',
            description: 'A question about the treatment, pain, results, price or offers',
          },
        ],
        entities: [
          {
            name: 'when',
            kind: 'datetime',
            description: 'The day and time the customer asked for',
          },
        ],
        retry: 'Sorry, I did not catch a day in that. Pick one from the list instead.',
      },
      next: { time: 'has-time', flexible: DAY, question: DESK, fallback: DAY },
    },
    {
      id: 'has-time',
      type: 'condition',
      data: {
        note: 'The server adds `whenMs` (epoch ms) for datetime entities it could resolve.',
        cases: [{ id: 'resolved', var: 'whenMs', op: 'notEmpty' }],
      },
      next: { resolved: 'ai-day', else: 'near' },
    },
    {
      id: 'ai-day',
      type: 'text',
      data: {
        set: { day: '{{whenMs}}', dayLabel: '{{whenMs|day}}' },
        text: 'Got it — {{when}}. Here are the free slots on {{dayLabel}}; pick the one closest to what you asked.',
      },
      next: SLOT,
    },
    {
      id: 'near',
      type: 'text',
      data: {
        text: 'Noted. Pick the day from the list and I will show the free slots closest to it.',
      },
      next: DAY,
    },
    ...slotPicker({
      day: DAY,
      slot: SLOT,
      next: 'phone',
      dayText: 'Which day suits you for *{{treatment}}*? We are closed on Sundays.',
      slotText: 'Free slots on {{dayLabel}} (IST). The session takes {{minutes}} minutes.',
      stepMin: 60,
    }),
    {
      id: 'phone',
      type: 'condition',
      data: {
        note: 'The signed-in profile may have no phone; ask for one then.',
        cases: [{ id: 'missing', var: 'user.phone', op: 'empty' }],
      },
      next: { missing: 'ask-phone', else: 'own-phone' },
    },
    {
      id: 'own-phone',
      type: 'text',
      data: { set: { clientPhone: '{{user.phone}}' }, text: 'Booking for {{user.fullName}}.' },
      next: REVIEW,
    },
    {
      id: 'ask-phone',
      type: 'input',
      data: {
        prompt: 'Which mobile number should we send the reminders and aftercare to?',
        var: 'clientPhone',
        kind: 'phone',
      },
      next: REVIEW,
    },
    {
      id: REVIEW,
      type: 'buttons',
      data: {
        header: 'Check your booking',
        text: '*Name:* {{user.fullName}}\n*Mobile:* {{clientPhone}}\n*Treatment:* {{treatment}}\n*Plan:* {{planLabel}}\n*With:* {{staff}}\n*When:* {{dayLabel}} at {{slot|time}}\n*Price:* {{payPrice|money}}',
        footer: 'Free rescheduling up to 24 hours before',
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
        set: { orderId: '$id:AAP', offer: '$price:500:20' },
        order: {
          orderId: '{{orderId}}',
          title: 'Aesthetic treatment',
          items: [
            {
              id: 'treatment',
              name: '{{treatment}} — {{planLabel}}',
              qty: 1,
              price: '{{payPrice}}',
            },
          ],
          adjustments: [{ id: 'offer', label: 'Pay-online offer', amount: '-{{offer}}' }],
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
        set: { bookingId: '$id:AAT' },
        order: {
          orderId: '{{orderId}}',
          title: 'Payment received',
          items: [
            {
              id: 'treatment',
              name: '{{treatment}} — {{planLabel}}',
              qty: 1,
              price: '{{payPrice}}',
            },
          ],
          adjustments: [{ id: 'offer', label: 'Pay-online offer', amount: '-{{offer}}' }],
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
          title: 'Treatment booked',
          subtitle: 'Aura Skin & Smile Clinic · Bandra West',
          fields: [
            { label: 'Name', value: '{{user.fullName}}' },
            { label: 'Treatment', value: '{{treatment}}' },
            { label: 'Plan', value: '{{planLabel}}' },
            { label: 'With', value: '{{staff}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Duration', value: '{{minutes}} min' },
          ],
          qrData: 'aura://aesthetic/{{bookingId}}?slot={{slot}}',
        },
        caption: 'Show this QR at reception. Package sessions are tracked against this booking.',
      },
      next: 'prep',
    },
    {
      id: 'prep',
      type: 'document',
      data: {
        document: {
          fileName: 'Aura_Pre-treatment_Instructions.pdf',
          fileType: 'PDF',
          pages: 2,
          sizeKb: 186,
          preview: {
            title: 'Before your treatment',
            subtitle: '{{treatment}} · {{planLabel}}',
            sections: [
              {
                kind: 'fields',
                heading: 'Booking',
                fields: [
                  { label: 'Name', value: '{{user.fullName}}' },
                  { label: 'Booking', value: '{{bookingId}}' },
                  { label: 'When', value: '{{dayLabel}}, {{slot|time}}' },
                  { label: 'Downtime', value: '{{downtime}}' },
                ],
              },
              {
                kind: 'text',
                heading: 'For 5 days before',
                text: '• Stop retinol, AHA/BHA and scrubs\n• No waxing, threading or bleaching on the area\n• Avoid sun tanning; use SPF 50 daily',
              },
              {
                kind: 'text',
                heading: 'On the day',
                text: '• Come with clean skin, no make-up or perfume\n• Tell us about any new medicines, pregnancy, cold sores or recent fillers',
              },
              {
                kind: 'table',
                heading: 'Consent checklist',
                columns: ['Item', 'Status'],
                rows: [
                  { id: 'history', cells: ['Medical history form', 'At reception'] },
                  { id: 'photos', cells: ['Before photos (private)', 'At the session'] },
                  { id: 'consent', cells: ['Treatment consent', 'Sign at the session'] },
                ],
              },
            ],
            footer: `Aura Skin & Smile Clinic · ${CLINIC.phone}`,
          },
        },
        caption: 'Your pre-treatment instructions. Please read them before the session.',
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Add the session to your calendar, or see real before-and-after results from our clients.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: '{{treatment}} at Aura',
              start: '{{slot}}',
              durationMin: 60,
              location: CLINIC.address,
            },
          },
          { kind: 'url', title: 'See results', url: CLINIC.gallery },
        ],
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: { afterMs: 20_000, label: 'Treatment reminder', note: 'Real use: the day before.' },
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
        header: 'Treatment tomorrow',
        text: 'Reminder: *{{treatment}}* tomorrow at {{slot|time}} (booking {{bookingId}}).\nCome with clean skin, no make-up, and skip retinol tonight.',
        buttons: [
          { id: 'confirm', title: 'I’ll be there' },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'help', title: 'Talk to us' },
        ],
      },
      next: { confirm: 'r-ok', reschedule: 're-day', help: DESK },
    },
    {
      id: 'r-ok',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'How is your skin today?',
        note: 'Real use: the morning after the session.',
      },
      next: { next: 'r-ok-end', later: 'after' },
    },
    {
      id: 'r-ok-end',
      type: 'end',
      data: {
        text: 'Thank you, {{user.firstName}}. See you tomorrow — we will check in after your session.',
        showMenu: true,
      },
    },
    {
      id: 'after',
      type: 'text',
      data: {
        text: 'Hi {{user.firstName}}, we hope you loved your {{treatment}} yesterday. Here is your aftercare plan and a quick check-in.',
      },
      next: 'to-aftercare',
    },
    {
      id: 'to-aftercare',
      type: 'jump',
      data: { workflowKey: 'aftercare' },
    },
    ...slotPicker({
      day: 're-day',
      slot: 're-slot',
      next: 're-done',
      dayText: 'Pick a new day — your payment carries over.',
      slotText: 'Free slots on {{dayLabel}}:',
      stepMin: 60,
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
      id: ADVICE,
      type: 'handoff',
      data: {
        agentName: 'Nisha (Skin therapist)',
        text: 'Hi {{user.firstName}}, I am Nisha, a skin therapist at Aura. Tell me what bothers you most about your skin or hair — and your skin type if you know it — and I will suggest the right treatment.',
      },
      next: 'agent-end',
    },
    {
      id: DESK,
      type: 'handoff',
      data: {
        agentName: FRONT_DESK.agentName,
        text: 'Hi {{user.firstName}}, Rhea from the Aura front desk. Happy to help with {{treatment}} — ask me anything about the session, results, packages or EMI options.',
      },
      next: 'desk-card',
    },
    {
      id: 'desk-card',
      type: 'contact',
      data: {
        contact: {
          name: FRONT_DESK.name,
          phone: FRONT_DESK.phone,
          role: FRONT_DESK.role,
          organisation: 'Aura Skin & Smile Clinic',
        },
      },
      next: 'agent-end',
    },
    {
      id: 'agent-end',
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
