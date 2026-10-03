/**
 * Return or exchange: a delivered item → return-window check → reason (with a description
 * for quality checks) → size exchange, replacement or refund (original payment, UPI for COD
 * orders, or store credit with a bonus) → pickup day → review → QR pickup ticket, store
 * drop-off pin and a pickup-day push.
 */
import { defineWorkflow } from '../../author';
import {
  CARE_AGENT,
  RETURN_REASONS,
  RETURNABLE,
  rupees,
  SIZES,
  STORE,
  type ReturnableItem,
} from './data';

const PICK = 'pick';
const DAY = 'x-day';
const CARE = 'care';
const CHOICE = 'choice';

/** Store credit carries a 5% bonus over the refund amount. */
const credit = (price: number): string => String(Math.round(price * 1.05));

function itemRow(item: ReturnableItem) {
  return {
    id: item.id,
    title: item.orderNo,
    description: `${item.item} · ${rupees(item.price)} · ${item.delivered}`,
    set: {
      retItem: item.item,
      retOrder: item.orderNo,
      retPrice: String(item.price),
      credit: credit(item.price),
      sized: item.sized,
      payment: item.payment,
      expired: item.expired,
    },
  };
}

export const returns = defineWorkflow({
  key: 'returns',
  name: 'Return or exchange',
  description: 'Free pickup, size exchange or refund in 7 days',
  keywords: ['return', 'exchange', 'refund', 'replace', 'replacement', 'wrong size', 'damaged'],
  nodes: [
    {
      id: PICK,
      type: 'list',
      data: {
        header: 'Returns & exchanges',
        text: 'Sorry it did not work out, {{user.firstName}}. Which item would you like to return or exchange?',
        footer: 'Free pickup · 7-day returns on most items',
        button: 'Delivered items',
        sections: [
          { id: 'items', title: 'Delivered recently', rows: RETURNABLE.map(itemRow) },
          {
            id: 'more',
            title: 'More',
            rows: [
              {
                id: 'policy',
                title: 'Return policy',
                description: 'What can be returned, and how refunds work',
              },
            ],
          },
        ],
      },
      next: { ...Object.fromEntries(RETURNABLE.map((i) => [i.id, 'window'])), policy: 'policy' },
    },
    {
      id: 'policy',
      type: 'cta',
      data: {
        text: 'Most items can be returned or exchanged within 7 days of delivery, unused and with tags. Innerwear, beauty products once opened and gift cards cannot be returned.',
        actions: [{ kind: 'url', title: 'Full return policy', url: STORE.returnsPolicy }],
      },
      next: PICK,
    },
    {
      id: 'window',
      type: 'condition',
      data: { cases: [{ id: 'closed', var: 'expired', op: 'eq', value: 'yes' }] },
      next: { closed: 'expired', else: 'reason' },
    },
    {
      id: 'expired',
      type: 'buttons',
      data: {
        text: 'The 7-day return window for {{retItem}} has closed. If it is not working, it is still covered by the 1-year brand warranty — we can raise a claim for you.',
        buttons: [
          { id: 'warranty', title: 'Warranty claim' },
          { id: 'other', title: 'Pick another item' },
        ],
      },
      next: { warranty: CARE, other: PICK },
    },
    {
      id: 'reason',
      type: 'list',
      data: {
        text: 'What is the reason for returning {{retItem}}?',
        button: 'Choose reason',
        sections: [
          {
            id: 'reasons',
            title: 'Reasons',
            rows: RETURN_REASONS.map((r) => ({
              id: r.id,
              title: r.title,
              description: r.description,
              set: { reason: r.title, needsDetail: r.detail },
            })),
          },
        ],
      },
      next: Object.fromEntries(RETURN_REASONS.map((r) => [r.id, 'needs-detail'])),
    },
    {
      id: 'needs-detail',
      type: 'condition',
      data: { cases: [{ id: 'detail', var: 'needsDetail', op: 'eq', value: 'yes' }] },
      next: { detail: 'detail', else: CHOICE },
    },
    {
      id: 'detail',
      type: 'input',
      data: {
        prompt:
          'Please describe the problem in a line — e.g. "left earbud does not charge" or "received blue instead of green".',
        var: 'issue',
        kind: 'text',
        error: 'Please type a little more so our quality team can check it.',
      },
      next: 'detail-ok',
    },
    {
      id: 'detail-ok',
      type: 'text',
      data: {
        text: 'Thank you — noted for our quality team: "{{issue}}". Our pickup partner will check the item at your door.',
      },
      next: CHOICE,
    },
    {
      id: CHOICE,
      type: 'condition',
      data: { cases: [{ id: 'sized', var: 'sized', op: 'eq', value: 'yes' }] },
      next: { sized: 'sized-choice', else: 'plain-choice' },
    },
    {
      id: 'sized-choice',
      type: 'buttons',
      data: {
        text: 'Would you like a different size of {{retItem}}, or your money back?',
        buttons: [
          { id: 'exchange', title: 'Exchange size' },
          { id: 'refund', title: 'Return & refund' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { exchange: 'new-size', refund: 'refund-to', cancel: 'not-raised' },
    },
    {
      id: 'plain-choice',
      type: 'buttons',
      data: {
        text: 'Would you like a replacement of {{retItem}}, or your money back?',
        buttons: [
          {
            id: 'replace',
            title: 'Replacement',
            set: { outcome: 'Replacement of the same item, delivered at pickup' },
          },
          { id: 'refund', title: 'Return & refund' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { replace: DAY, refund: 'refund-to', cancel: 'not-raised' },
    },
    {
      id: 'new-size',
      type: 'list',
      data: {
        text: 'Which size should we bring when we pick up {{retItem}}?',
        button: 'Choose size',
        sections: [
          {
            id: 'sizes',
            title: 'Sizes in stock',
            rows: SIZES.map((s) => ({
              ...s,
              set: { outcome: `Exchange for size ${s.title}, delivered at pickup` },
            })),
          },
        ],
      },
      next: Object.fromEntries(SIZES.map((s) => [s.id, DAY])),
    },
    {
      id: 'refund-to',
      type: 'condition',
      data: {
        note: 'Cash orders cannot be refunded to the original payment method.',
        cases: [{ id: 'cod', var: 'payment', op: 'eq', value: 'Cash on delivery' }],
      },
      next: { cod: 'cod-refund', else: 'paid-refund' },
    },
    {
      id: 'paid-refund',
      type: 'buttons',
      data: {
        text: 'Where should the {{retPrice|money}} go? Store credit adds a 5% bonus and is instant.',
        buttons: [
          {
            id: 'original',
            title: 'Original payment',
            set: { outcome: 'Refund {{retPrice|money}} to your original payment in 5–7 days' },
          },
          {
            id: 'credit',
            title: 'Store credit +5%',
            set: { outcome: 'Store credit of {{credit|money}}, added as soon as it is picked up' },
          },
        ],
      },
      next: { original: DAY, credit: DAY },
    },
    {
      id: 'cod-refund',
      type: 'buttons',
      data: {
        text: 'You paid cash for this order, so we refund to UPI or as store credit (with a 5% bonus).',
        buttons: [
          { id: 'upi', title: 'Refund to UPI' },
          {
            id: 'credit',
            title: 'Store credit +5%',
            set: { outcome: 'Store credit of {{credit|money}}, added as soon as it is picked up' },
          },
        ],
      },
      next: { upi: 'upi', credit: DAY },
    },
    {
      id: 'upi',
      type: 'input',
      data: {
        prompt: 'Please type the UPI ID for the refund, e.g. yourname@okbank.',
        var: 'upiId',
        kind: 'text',
        error: 'Please type a UPI ID, e.g. yourname@okbank.',
      },
      next: 'upi-ok',
    },
    {
      id: 'upi-ok',
      type: 'text',
      data: {
        set: { outcome: 'Refund {{retPrice|money}} to UPI {{upiId}} within 48 hours of pickup' },
        text: 'Thanks — we will send a ₹1 test credit to {{upiId}} first, so you know it is right.',
      },
      next: DAY,
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'When should we pick up {{retItem}}? Our partner comes between 10 am and 6 pm — please keep it packed with the tags on.',
        button: 'Pickup day',
        sections: [],
        dynamic: { kind: 'days', count: 5, var: 'day' },
      },
      next: { pick: 'review' },
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check your request',
        text: '*Item:* {{retItem}}\n*Order:* {{retOrder}}\n*Reason:* {{reason}}\n*Outcome:* {{outcome}}\n*Pickup:* {{dayLabel}}, 10 am – 6 pm\n*Name:* {{user.fullName}}',
        footer: 'Pickup is free',
        buttons: [
          { id: 'confirm', title: 'Confirm' },
          { id: 'change', title: 'Change day' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'ticket', change: DAY, cancel: 'not-raised' },
    },
    {
      id: 'ticket',
      type: 'ticket',
      data: {
        complete: true,
        set: { retId: '$id:RT' },
        ticket: {
          ticketId: '{{retId}}',
          title: 'Pickup scheduled',
          subtitle: 'Bazaarly returns · order {{retOrder}}',
          fields: [
            { label: 'Item', value: '{{retItem}}' },
            { label: 'Reason', value: '{{reason}}' },
            { label: 'Pickup', value: '{{dayLabel}}, 10 am – 6 pm' },
            { label: 'Outcome', value: '{{outcome}}' },
          ],
          qrData: 'bazaarly://returns/{{retId}}?order={{retOrder}}&day={{day}}',
        },
        caption:
          'Show this QR to our pickup partner. Keep the item in its original packaging with the tags on.',
      },
      next: 'drop-off',
    },
    {
      id: 'drop-off',
      type: 'location',
      data: {
        location: { name: STORE.name, address: STORE.address, lat: STORE.lat, lng: STORE.lng },
        caption:
          'In a hurry? Drop it off at our Koramangala store any day, 10 am – 9 pm, with the same QR — your refund or exchange starts on the spot.',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Pickup today',
        note: 'Real use: the morning of the pickup.',
      },
      next: { next: 'raised', later: 'r-msg' },
    },
    {
      id: 'raised',
      type: 'end',
      data: {
        text: 'All set, {{user.firstName}}. We will remind you on the pickup day.',
        showMenu: true,
      },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Pickup today',
        text: 'Our partner will pick up {{retItem}} today between 10 am and 6 pm (request {{retId}}). Please keep it packed with the tags on.',
        buttons: [
          { id: 'ok', title: 'Ready' },
          { id: 'change', title: 'Another day' },
          { id: 'help', title: 'Talk to us' },
        ],
      },
      next: { ok: 'r-ok', change: 're-day', help: CARE },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: { text: 'Thank you! {{outcome}}.', showMenu: true },
    },
    {
      id: 're-day',
      type: 'list',
      data: {
        text: 'Pick a new pickup day — request {{retId}} stays the same.',
        button: 'Pickup day',
        sections: [],
        dynamic: { kind: 'days', count: 5, var: 'day' },
      },
      next: { pick: 're-done' },
    },
    {
      id: 're-done',
      type: 'end',
      data: {
        text: 'Done — the pickup for {{retId}} moved to {{dayLabel}}, 10 am – 6 pm.',
        showMenu: true,
      },
    },
    {
      id: CARE,
      type: 'handoff',
      data: {
        agentName: CARE_AGENT.agentName,
        text: 'Hi {{user.firstName}}, Nisha from Bazaarly Care. I can see {{retItem}} from order {{retOrder}}. Let me help you with it.',
      },
      next: 'care-end',
    },
    { id: 'care-end', type: 'end', data: { showMenu: true } },
    {
      id: 'not-raised',
      type: 'end',
      data: {
        text: 'No request was raised. You can start a return any time within 7 days of delivery.',
        showMenu: true,
      },
    },
  ],
});
