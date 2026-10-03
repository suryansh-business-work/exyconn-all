/**
 * Cash-on-delivery confirmation: the order summary a COD order triggers → confirm (address
 * check or change), switch to prepaid for a discount, or cancel (with a save offer and a
 * hand-off) → an out-for-delivery push with the OTP, cash amount and a UPI option.
 */
import { defineWorkflow } from '../../author';
import { CANCEL_REASONS, CARE_AGENT, COD_FEE, COD_ORDER } from './data';

const ADDRESS = 'addr';
const CONFIRMED = 'confirmed';
const PREPAY = 'prepay';
const CARE = 'care';

const ITEMS = COD_ORDER.items.map((i) => ({ ...i }));

export const codConfirm = defineWorkflow({
  key: 'cod-confirm',
  name: 'Confirm COD order',
  description: 'Confirm, prepay and save, or cancel a cash order',
  keywords: ['cod', 'cash on delivery', 'confirm order', 'confirm my order', 'cancel order'],
  nodes: [
    {
      id: 'intro',
      type: 'text',
      data: {
        set: {
          orderNo: COD_ORDER.orderNo,
          address: COD_ORDER.address,
          codTotal: String(COD_ORDER.total),
          prepaidTotal: String(COD_ORDER.prepaidTotal),
          saving: String(COD_ORDER.total - COD_ORDER.prepaidTotal),
        },
        text: 'Hi {{user.firstName}}, thank you for shopping with Bazaarly! You chose cash on delivery for order {{orderNo}}. Please confirm it so we can ship it today.',
      },
      next: 'cod-order',
    },
    {
      id: 'cod-order',
      type: 'order',
      data: {
        order: {
          orderId: '{{orderNo}}',
          title: 'Cash on delivery',
          items: ITEMS,
          adjustments: [
            { id: 'delivery', label: 'Delivery', amount: COD_ORDER.delivery },
            { id: 'cod', label: 'COD handling fee', amount: COD_FEE },
          ],
          status: 'pending',
        },
      },
      next: 'ask',
    },
    {
      id: 'ask',
      type: 'buttons',
      data: {
        text: 'Pay {{codTotal|money}} in cash at delivery, or pay online now and save {{saving|money}}.',
        footer: 'Unconfirmed COD orders are cancelled after 24 hours',
        buttons: [
          { id: 'confirm', title: 'Confirm COD' },
          { id: 'prepay', title: 'Pay online & save' },
          { id: 'cancel', title: 'Cancel order' },
        ],
      },
      next: { confirm: ADDRESS, prepay: PREPAY, cancel: 'cancel-reason' },
    },
    {
      id: ADDRESS,
      type: 'buttons',
      data: {
        text: 'We will deliver to:\n{{address}}\n\nIs that right?',
        buttons: [
          { id: 'yes', title: 'Yes, deliver here' },
          { id: 'change', title: 'Change address' },
        ],
      },
      next: { yes: CONFIRMED, change: 'new-pin' },
    },
    {
      id: 'new-pin',
      type: 'input',
      data: {
        prompt: 'Please type the 6-digit PIN code of the new address.',
        var: 'pincode',
        kind: 'pincode',
      },
      next: 'new-addr',
    },
    {
      id: 'new-addr',
      type: 'input',
      data: {
        prompt: 'Now the full address — flat or house number, street, area and a landmark.',
        var: 'newAddress',
        kind: 'text',
        error: 'Please type a little more of the address so our partner can find you.',
      },
      next: 'addr-ok',
    },
    {
      id: 'addr-ok',
      type: 'text',
      data: {
        set: { address: '{{newAddress}}, {{pincode}}' },
        text: 'Updated. We will deliver to:\n{{address}}',
      },
      next: CONFIRMED,
    },
    {
      id: CONFIRMED,
      type: 'text',
      data: {
        complete: true,
        set: { eta: '$days:3' },
        text: 'Order {{orderNo}} is confirmed and ships today. It arrives by {{eta|day}}. Please keep {{codTotal|money}} ready — exact change helps, and UPI at the door works too.',
      },
      next: 'cod-remind',
    },
    {
      id: 'cod-remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Out for delivery',
        note: 'Real use: the morning of delivery.',
      },
      next: { next: 'confirmed-end', later: 'r-ofd' },
    },
    {
      id: 'confirmed-end',
      type: 'end',
      data: {
        text: 'Thank you, {{user.firstName}}. We will message you when it is out for delivery.',
        showMenu: true,
      },
    },
    {
      id: 'r-ofd',
      type: 'buttons',
      data: {
        header: 'Out for delivery',
        set: { otp: '$int:1000:9999' },
        text: 'Order {{orderNo}} is out for delivery and arrives today by 7 pm.\nAmount to pay: {{codTotal|money}} (cash or UPI at the door).\nDelivery OTP: *{{otp}}*.',
        buttons: [
          { id: 'ok', title: 'Okay' },
          { id: 'upi', title: 'Pay by UPI now' },
          { id: 'away', title: 'Not at home' },
        ],
      },
      next: { ok: 'ofd-end', upi: PREPAY, away: 'resched' },
    },
    {
      id: 'ofd-end',
      type: 'end',
      data: {
        text: 'See you soon! Share the OTP only once the parcel is in your hands.',
        showMenu: true,
      },
    },
    {
      id: 'resched',
      type: 'list',
      data: {
        text: 'No problem. Which day should we try again?',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 5, var: 'day' },
      },
      next: { pick: 'resched-ok' },
    },
    {
      id: 'resched-ok',
      type: 'end',
      data: {
        text: 'Done — order {{orderNo}} will be delivered on {{dayLabel}}. Keep {{codTotal|money}} ready.',
        showMenu: true,
      },
    },
    {
      id: PREPAY,
      type: 'order',
      data: {
        set: { payId: '$id:PAY' },
        order: {
          orderId: '{{orderNo}}',
          title: 'Pay online and save',
          items: ITEMS,
          adjustments: [
            { id: 'delivery', label: 'Delivery', amount: COD_ORDER.delivery },
            { id: 'prepaid', label: 'Prepaid discount (5%)', amount: -COD_ORDER.prepaidDiscount },
          ],
          status: 'pending',
          payTitle: 'Pay now',
        },
      },
      next: { pay: 'prepaid' },
    },
    {
      id: 'prepaid',
      type: 'order',
      data: {
        order: {
          orderId: '{{orderNo}}',
          title: 'Payment received',
          items: ITEMS,
          adjustments: [
            { id: 'delivery', label: 'Delivery', amount: COD_ORDER.delivery },
            { id: 'prepaid', label: 'Prepaid discount (5%)', amount: -COD_ORDER.prepaidDiscount },
          ],
          status: 'paid',
        },
      },
      next: 'prepaid-end',
    },
    {
      id: 'prepaid-end',
      type: 'end',
      data: {
        complete: true,
        text: 'Paid {{prepaidTotal|money}} (payment {{payId}}) — you saved {{saving|money}}. No cash needed at the door, just the delivery OTP.',
        showMenu: true,
      },
    },
    {
      id: 'cancel-reason',
      type: 'list',
      data: {
        text: 'Sorry to hear that. Why would you like to cancel order {{orderNo}}?',
        button: 'Choose reason',
        sections: [
          {
            id: 'reasons',
            title: 'Reasons',
            rows: CANCEL_REASONS.map((r) => ({ ...r, set: { cancelReason: r.id } })),
          },
        ],
      },
      next: Object.fromEntries(CANCEL_REASONS.map((r) => [r.id, 'save'])),
    },
    {
      id: 'save',
      type: 'condition',
      data: {
        note: 'No cash → offer prepaid; something else → a person; the rest confirm the cancel.',
        cases: [
          { id: 'cash', var: 'cancelReason', op: 'eq', value: 'cash' },
          { id: 'other', var: 'cancelReason', op: 'eq', value: 'other' },
        ],
      },
      next: { cash: 'cash-offer', other: CARE, else: 'cancel-q' },
    },
    {
      id: 'cash-offer',
      type: 'buttons',
      data: {
        text: 'No cash at hand? Pay online now instead — it is {{prepaidTotal|money}} with the prepaid discount, and the order still ships today.',
        buttons: [
          { id: 'pay', title: 'Pay online' },
          { id: 'cancel', title: 'Cancel anyway' },
        ],
      },
      next: { pay: PREPAY, cancel: 'cancel-q' },
    },
    {
      id: 'cancel-q',
      type: 'buttons',
      data: {
        text: 'Cancel order {{orderNo}}? Nothing has been charged.',
        buttons: [
          { id: 'yes', title: 'Yes, cancel' },
          { id: 'keep', title: 'Keep my order' },
        ],
      },
      next: { yes: 'cancelled', keep: ADDRESS },
    },
    {
      id: 'cancelled',
      type: 'end',
      data: {
        complete: true,
        text: 'Order {{orderNo}} is cancelled. Your cart is saved if you change your mind.',
        showMenu: true,
      },
    },
    {
      id: CARE,
      type: 'handoff',
      data: {
        agentName: CARE_AGENT.agentName,
        text: 'Hi {{user.firstName}}, Nisha from Bazaarly Care. I have order {{orderNo}} open — tell me what is on your mind and I will help.',
      },
      next: 'care-end',
    },
    { id: 'care-end', type: 'end', data: { showMenu: true } },
  ],
});
