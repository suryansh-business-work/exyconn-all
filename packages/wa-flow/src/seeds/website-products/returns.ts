/**
 * Returns & refunds: order number → reason (change-of-mind returns get the condition rules)
 * → replacement, refund or store credit → pickup day and slot → a return pass with a QR →
 * a "refund processed" push.
 */
import { defineWorkflow } from '../../author';

const RESOLUTION = 'resolution';

const REASONS = [
  { id: 'damaged', title: 'Arrived damaged', description: 'Broken, dented or missing parts' },
  { id: 'faulty', title: 'Not working', description: 'Will not power on, pair or connect' },
  { id: 'wrong', title: 'Wrong item', description: 'Different model or colour' },
  { id: 'changed', title: 'Changed my mind', description: 'Unused, in the original box' },
] as const;

const OUTCOMES = [
  { id: 'replace', title: 'Replacement', label: 'Free replacement' },
  { id: 'refund', title: 'Refund', label: 'Refund to original payment' },
  { id: 'credit', title: 'Store credit +5%', label: 'Store credit with 5% bonus' },
] as const;

export const returns = defineWorkflow({
  key: 'returns',
  name: 'Returns & refunds',
  description: 'Free pickup, refund in 2–3 days after pickup',
  keywords: ['return', 'refund', 'replace', 'replacement', 'damaged', 'exchange'],
  nodes: [
    {
      id: 'ask',
      type: 'input',
      data: {
        prompt:
          'I can sort that out, {{user.firstName}}. Which order is it? Type the order number starting with LH.',
        var: 'returnNo',
        kind: 'text',
      },
      next: 'reason',
    },
    {
      id: 'reason',
      type: 'list',
      data: {
        text: 'What went wrong with {{returnNo|upper}}?',
        button: 'Choose reason',
        sections: [
          {
            id: 'reasons',
            title: 'Reasons',
            rows: REASONS.map((r) => ({ ...r, set: { returnReason: r.id, reasonLabel: r.title } })),
          },
        ],
      },
      next: Object.fromEntries(REASONS.map((r) => [r.id, 'policy'])),
    },
    {
      id: 'policy',
      type: 'condition',
      data: { cases: [{ id: 'changed', var: 'returnReason', op: 'eq', value: 'changed' }] },
      next: { changed: 'rules', else: 'sorry' },
    },
    {
      id: 'rules',
      type: 'text',
      data: {
        text: 'No problem — change-of-mind returns are free within 7 days of delivery, as long as the product is unused and in its original box with all accessories.',
      },
      next: RESOLUTION,
    },
    {
      id: 'sorry',
      type: 'text',
      data: {
        text: 'I am really sorry about that. We will collect it free of charge — no questions asked.',
      },
      next: RESOLUTION,
    },
    {
      id: RESOLUTION,
      type: 'buttons',
      data: {
        text: 'What would you like instead?',
        buttons: OUTCOMES.map((o) => ({ id: o.id, title: o.title, set: { outcome: o.label } })),
      },
      next: Object.fromEntries(OUTCOMES.map((o) => [o.id, 'day'])),
    },
    {
      id: 'day',
      type: 'list',
      data: {
        text: 'When should our courier pick it up?',
        button: 'Pickup day',
        sections: [],
        dynamic: { kind: 'days', count: 5, skipSundays: true, var: 'pickupDay' },
      },
      next: { pick: 'slot' },
    },
    {
      id: 'slot',
      type: 'list',
      data: {
        text: 'Pickup windows on {{pickupDayLabel}}:',
        button: 'Pickup time',
        sections: [
          {
            id: 'more',
            title: 'More options',
            rows: [{ id: 'other-day', title: 'Pick another day' }],
          },
        ],
        dynamic: {
          kind: 'slots',
          dayVar: 'pickupDay',
          from: 9,
          to: 19,
          stepMin: 120,
          take: 5,
          var: 'pickupSlot',
        },
      },
      next: { pick: 'pass', 'other-day': 'day' },
    },
    {
      id: 'pass',
      type: 'ticket',
      data: {
        complete: true,
        set: { rmaNo: '$id:RMA' },
        ticket: {
          ticketId: '{{rmaNo}}',
          title: 'Return pickup pass',
          subtitle: '{{reasonLabel}}',
          fields: [
            { label: 'Order', value: '{{returnNo|upper}}' },
            { label: 'Pickup', value: '{{pickupDayLabel}}, from {{pickupSlotLabel}}' },
            { label: 'Resolution', value: '{{outcome}}' },
            { label: 'Customer', value: '{{user.fullName}}' },
          ],
          qrData: 'https://lumiohome.example/r/{{rmaNo}}',
        },
        caption:
          'Show this QR to the courier. Keep the product in any box — the courier brings packing material.',
      },
      next: 'refund-push',
    },
    {
      id: 'refund-push',
      type: 'reminder',
      data: {
        afterMs: 25_000,
        label: 'Return update',
        note: 'Real use: once the warehouse checks the item.',
      },
      next: { next: 'pass-end', later: 'processed' },
    },
    {
      id: 'pass-end',
      type: 'end',
      data: {
        text: 'All set. I will update you as soon as the return is processed.',
        showMenu: true,
      },
    },
    {
      id: 'processed',
      type: 'end',
      data: {
        text: 'Good news, {{user.firstName}} — return {{rmaNo}} is checked and your {{outcome|lower}} is on its way. Thanks for your patience.',
        showMenu: true,
      },
    },
  ],
});
