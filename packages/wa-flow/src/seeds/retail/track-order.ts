/**
 * Order tracking: a recent order (or a typed order number) → in transit (live tracking link,
 * a new delivery day in the customer's own words via AI, an out-for-delivery push), out for
 * delivery (partner card, delivery OTP, pay the COD amount by UPI) or delivered (rating, a
 * return/exchange, "not received" to an agent).
 */
import { defineWorkflow } from '../../author';
import { CARE_AGENT, DELIVERY_PARTNER, RECENT_ORDERS, rupees, STORE, type PastOrder } from './data';

const ROUTE = 'route';
const WHEN = 'when';
const CARE = 'care';
const RATE = 'rate';
const NOT_HOME = 'not-home';

const STATUS_LABEL: Readonly<Record<PastOrder['status'], string>> = {
  shipped: 'In transit',
  ofd: 'Out for delivery',
  delivered: 'Delivered',
};

function orderRow(order: PastOrder) {
  return {
    id: order.id,
    title: order.orderNo,
    description: `${order.item} · ${rupees(order.price)} · ${STATUS_LABEL[order.status]}`,
    set: {
      orderNo: order.orderNo,
      item: order.item,
      price: String(order.price),
      status: order.status,
      courier: order.courier,
      awb: order.awb,
      payment: order.payment,
    },
  };
}

const STARS = [
  { id: 'star-5', title: '★★★★★ Excellent', description: 'On time, polite and careful' },
  { id: 'star-4', title: '★★★★ Good', description: 'Mostly smooth' },
  { id: 'star-3', title: '★★★ Okay', description: 'Could have been better' },
  { id: 'star-2', title: '★★ Poor', description: 'Late or careless handling' },
  { id: 'star-1', title: '★ Very poor', description: 'Something went badly wrong' },
];

export const trackOrder = defineWorkflow({
  key: 'track-order',
  name: 'Track my order',
  description: 'Live status, delivery day changes and COD payment',
  keywords: ['track', 'where is my order', 'order status', 'delivery', 'awb', 'shipment'],
  nodes: [
    {
      id: 'pick',
      type: 'list',
      data: {
        header: 'Track an order',
        text: 'Hi {{user.firstName}}, here are your recent orders. Pick one, or type another order number.',
        button: 'My orders',
        sections: [
          { id: 'recent', title: 'Recent orders', rows: RECENT_ORDERS.map(orderRow) },
          {
            id: 'other',
            title: 'Something else',
            rows: [
              {
                id: 'other-no',
                title: 'Another order number',
                description: 'From your confirmation SMS or email',
              },
            ],
          },
        ],
      },
      next: {
        ...Object.fromEntries(RECENT_ORDERS.map((o) => [o.id, ROUTE])),
        'other-no': 'ask-no',
      },
    },
    {
      id: 'ask-no',
      type: 'input',
      data: {
        prompt: 'Please type the order number, e.g. BZ-58210473.',
        var: 'orderNo',
        kind: 'text',
        error: 'Please type the full order number, e.g. BZ-58210473.',
      },
      next: 'lookup',
    },
    {
      id: 'lookup',
      type: 'text',
      data: {
        set: {
          status: '$pick:shipped|ofd|delivered',
          item: '$pick:Pulse Smartwatch 2|Rattan Table Lamp|Vitamin C Face Serum',
          price: '$price:1500:30',
          courier: 'Bazaarly Express',
          awb: '$id:BXP',
          payment: '$pick:Prepaid|Cash on delivery',
        },
        text: 'Found it — order {{orderNo}}: {{item}}, {{price|money}} ({{payment}}).',
      },
      next: ROUTE,
    },
    {
      id: ROUTE,
      type: 'condition',
      data: {
        set: { eta: '$days:2', otp: '$int:1000:9999' },
        cases: [
          { id: 'shipped', var: 'status', op: 'eq', value: 'shipped' },
          { id: 'ofd', var: 'status', op: 'eq', value: 'ofd' },
        ],
      },
      next: { shipped: 's-status', ofd: 'o-status', else: 'd-status' },
    },
    // In transit
    {
      id: 's-status',
      type: 'image',
      data: {
        image: {
          icon: 'shipping',
          accent: 'orange',
          title: 'In transit',
          subtitle: '{{courier}} · {{awb}}',
        },
        caption:
          '{{item}} has left our Bhiwandi warehouse and reached the Bengaluru hub. Expected delivery: {{eta|day}}, between 9 am and 9 pm.',
      },
      next: 's-cta',
    },
    {
      id: 's-cta',
      type: 'cta',
      data: {
        text: 'Follow the parcel live, or call us if anything looks off.',
        actions: [
          { kind: 'url', title: 'Live tracking', url: `${STORE.trackUrl}/{{awb}}` },
          { kind: 'call', title: 'Call Bazaarly', phone: STORE.phone },
        ],
      },
      next: 's-actions',
    },
    {
      id: 's-actions',
      type: 'buttons',
      data: {
        text: 'Anything you would like to change for order {{orderNo}}?',
        buttons: [
          { id: 'change', title: 'Change delivery day' },
          { id: 'notify', title: 'Notify me' },
          { id: 'help', title: 'Talk to us' },
        ],
      },
      next: { change: WHEN, notify: 's-remind', help: CARE },
    },
    {
      id: WHEN,
      type: 'ai',
      data: {
        set: { deliveryDay: '$days:1', deliveryWindow: '9 am – 9 pm' },
        prompt:
          'When would suit you? Type it your way — "kal shaam 5 baje", "Saturday morning" or "after the 10th".',
        intents: [
          { id: 'reschedule', description: 'Gives a new day or time for the delivery' },
          { id: 'cancel', description: 'Does not want the order any more' },
          { id: 'address', description: 'Wants to change the delivery address' },
        ],
        entities: [
          { name: 'deliveryDay', kind: 'date', description: 'The day the customer wants it' },
          {
            name: 'deliveryWindow',
            kind: 'text',
            description: 'The time of day, e.g. "after 5 pm" or "morning"',
          },
        ],
        retry: 'Sorry, I could not read a day in that. Please pick one from the list.',
      },
      next: { reschedule: 'ai-day', cancel: 'cancel-q', address: CARE, fallback: 'pick-day' },
    },
    {
      id: 'ai-day',
      type: 'text',
      data: {
        set: { day: '{{deliveryDay}}' },
        text: 'Got it — {{deliveryDay|day}}, {{deliveryWindow}}.',
      },
      next: 'resched-ok',
    },
    {
      id: 'pick-day',
      type: 'list',
      data: {
        text: 'Which day should we deliver {{item}}?',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 6, var: 'day' },
      },
      next: { pick: 'resched-ok' },
    },
    {
      id: 'resched-ok',
      type: 'end',
      data: {
        complete: true,
        text: 'Done — order {{orderNo}} will now arrive on {{day|day}} ({{deliveryWindow}}). We will message you the morning it goes out.',
        showMenu: true,
      },
    },
    {
      id: 'cancel-q',
      type: 'buttons',
      data: {
        text: 'Cancel order {{orderNo}} ({{item}})? Prepaid amounts are refunded in 5–7 working days; nothing is charged on cash on delivery.',
        buttons: [
          { id: 'yes', title: 'Yes, cancel', set: { refundId: '$id:RF' } },
          { id: 'keep', title: 'Keep it' },
        ],
      },
      next: { yes: 'cancelled', keep: 'pick-day' },
    },
    {
      id: 'cancelled',
      type: 'end',
      data: {
        complete: true,
        text: 'Order {{orderNo}} is cancelled. Reference: {{refundId}}. We hope to see you again soon.',
        showMenu: true,
      },
    },
    {
      id: 's-remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Out for delivery',
        note: 'Real use: the morning it leaves the hub.',
      },
      next: { next: 's-end', later: 'push-ofd' },
    },
    {
      id: 's-end',
      type: 'end',
      data: {
        complete: true,
        text: 'Done — we will message you the moment {{item}} is out for delivery.',
        showMenu: true,
      },
    },
    {
      id: 'push-ofd',
      type: 'buttons',
      data: {
        header: 'Out for delivery',
        text: 'Good news, {{user.firstName}} — {{item}} (order {{orderNo}}) is out for delivery and arrives today by 7 pm.\nDelivery OTP: *{{otp}}*. Share it only once the parcel is in your hands.',
        buttons: [
          { id: 'ok', title: 'Great, thanks' },
          { id: 'away', title: 'Not at home' },
          { id: 'help', title: 'Talk to us' },
        ],
      },
      next: { ok: 'o-end', away: NOT_HOME, help: CARE },
    },
    // Out for delivery
    {
      id: 'o-status',
      type: 'image',
      data: {
        image: {
          icon: 'truck',
          accent: 'amber',
          title: 'Out for delivery',
          subtitle: 'Arriving today by 7 pm',
        },
        caption: '{{item}} is with our delivery partner and arrives today. Payment: {{payment}}.',
      },
      next: 'o-partner',
    },
    {
      id: 'o-partner',
      type: 'contact',
      data: { contact: { ...DELIVERY_PARTNER } },
      next: 'o-otp',
    },
    {
      id: 'o-otp',
      type: 'notice',
      data: {
        text: 'Delivery OTP for {{orderNo}}: {{otp}}. Bazaarly will never ask you to share it before the parcel is in your hands.',
      },
      next: 'o-cod',
    },
    {
      id: 'o-cod',
      type: 'condition',
      data: { cases: [{ id: 'cash', var: 'payment', op: 'eq', value: 'Cash on delivery' }] },
      next: { cash: 'o-cash', else: 'o-actions' },
    },
    {
      id: 'o-cash',
      type: 'buttons',
      data: {
        text: 'This is a cash-on-delivery order. Keep {{price|money}} ready, or pay by UPI now for a contact-free handover.',
        buttons: [
          { id: 'upi', title: 'Pay by UPI now' },
          { id: 'cash', title: 'I will pay cash' },
          { id: 'away', title: 'Not at home' },
        ],
      },
      next: { upi: 'o-pay', cash: 'o-end', away: NOT_HOME },
    },
    {
      id: 'o-pay',
      type: 'order',
      data: {
        order: {
          orderId: '{{orderNo}}',
          title: 'Pay before delivery',
          items: [{ id: 'item', name: '{{item}}', qty: 1, price: '{{price}}' }],
          status: 'pending',
          payTitle: 'Pay now',
        },
      },
      next: { pay: 'o-paid' },
    },
    {
      id: 'o-paid',
      type: 'order',
      data: {
        order: {
          orderId: '{{orderNo}}',
          title: 'Paid — no cash needed',
          items: [{ id: 'item', name: '{{item}}', qty: 1, price: '{{price}}' }],
          status: 'paid',
        },
      },
      next: 'o-end',
    },
    {
      id: 'o-actions',
      type: 'buttons',
      data: {
        text: 'Order {{orderNo}} is prepaid — nothing to pay at the door.',
        buttons: [
          { id: 'ok', title: 'Got it' },
          { id: 'away', title: 'Not at home' },
          { id: 'help', title: 'Talk to us' },
        ],
      },
      next: { ok: 'o-end', away: NOT_HOME, help: CARE },
    },
    {
      id: NOT_HOME,
      type: 'buttons',
      data: {
        text: 'No problem. We can leave it with a neighbour or security, or try another day.',
        buttons: [
          { id: 'security', title: 'Leave at security' },
          { id: 'later', title: 'Another day' },
        ],
      },
      next: { security: 'left-security', later: WHEN },
    },
    {
      id: 'left-security',
      type: 'end',
      data: {
        complete: true,
        text: 'Noted — {{item}} will be left with your building security, and we will send a photo once it is handed over.',
        showMenu: true,
      },
    },
    {
      id: 'o-end',
      type: 'end',
      data: {
        complete: true,
        text: 'Your parcel arrives today, {{user.firstName}}. Delivery OTP: {{otp}}.',
        showMenu: true,
      },
    },
    // Delivered
    {
      id: 'd-status',
      type: 'image',
      data: {
        image: { icon: 'check', accent: 'green', title: 'Delivered', subtitle: '{{orderNo}}' },
        caption: '{{item}} was delivered and signed for with your OTP. We hope you love it!',
      },
      next: 'd-actions',
    },
    {
      id: 'd-actions',
      type: 'buttons',
      data: {
        text: 'How did it go?',
        buttons: [
          { id: 'rate', title: 'Rate delivery' },
          { id: 'return', title: 'Return or exchange' },
          { id: 'missing', title: 'Not received' },
        ],
      },
      next: { rate: RATE, return: 'to-returns', missing: CARE },
    },
    {
      id: RATE,
      type: 'list',
      data: {
        text: 'How would you rate the delivery of order {{orderNo}}?',
        button: 'Rate',
        sections: [
          {
            id: 'stars',
            title: 'Your rating',
            rows: STARS.map((s) => ({ ...s, set: { rating: s.title } })),
          },
        ],
      },
      next: Object.fromEntries(STARS.map((s) => [s.id, 'rated'])),
    },
    {
      id: 'rated',
      type: 'end',
      data: {
        complete: true,
        text: 'Thank you, {{user.firstName}}! Your feedback goes straight to our delivery team.',
        showMenu: true,
      },
    },
    { id: 'to-returns', type: 'jump', data: { workflowKey: 'returns' } },
    {
      id: CARE,
      type: 'handoff',
      data: {
        agentName: CARE_AGENT.agentName,
        text: 'Hi {{user.firstName}}, Nisha from Bazaarly Care here. I have order {{orderNo}} open in front of me — tell me what happened and I will sort it out.',
      },
      next: 'care-end',
    },
    { id: 'care-end', type: 'end', data: { showMenu: true } },
  ],
});
