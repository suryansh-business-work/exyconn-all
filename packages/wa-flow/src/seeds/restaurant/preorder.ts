/**
 * Pre-order food: for the table booked in this chat, or a takeaway pickup when there is
 * none. Platter carousel → drinks add-on → spice level → order and payment → GST invoice →
 * kitchen QR. Takeaway gets a map pin and an "order ready" push.
 */
import { defineWorkflow } from '../../author';
import type { Product } from '../../schema';
import { rupees } from '../healthcare/data';
import { DRINKS, PLATTERS, RESTAURANT, type Dish } from './data';

const PLATTER = 'platters';
const DRINK = 'drinks';
const SPICE = 'spice';

function platterCard(dish: Dish): Product {
  return {
    id: dish.id,
    title: dish.title,
    subtitle: dish.subtitle,
    price: dish.price,
    mrp: dish.mrp,
    badge: dish.badge,
    image: { icon: dish.icon, accent: dish.accent, title: dish.title },
    buttonTitle: 'Add to order',
    set: { platter: dish.title, platterPrice: String(dish.price) },
  };
}

const ITEMS = [
  { id: 'platter', name: '{{platter}}', qty: 1, price: '{{platterPrice}}' },
  { id: 'drink', name: '{{drink}}', qty: 1, price: '{{drinkPrice}}' },
];
const PLATTER_ONLY = [ITEMS[0]];
const TAXES = [
  { id: 'gst', label: 'GST (5%)', amount: '{{gst}}' },
  { id: 'offer', label: 'Pre-order offer', amount: -100 },
];

export const preorder = defineWorkflow({
  key: 'preorder',
  name: 'Pre-order food',
  description: 'Platters ready at your table, or takeaway pickup',
  keywords: ['pre-order', 'preorder', 'order food', 'takeaway', 'take away', 'platter', 'parcel'],
  nodes: [
    {
      id: 'has-table',
      type: 'condition',
      data: {
        note: 'Pre-orders attach to the table booked in this chat; otherwise offer takeaway.',
        cases: [{ id: 'none', var: 'bookingId', op: 'empty' }],
      },
      next: { none: 'no-table', else: 'for-table' },
    },
    {
      id: 'for-table',
      type: 'text',
      data: {
        set: { mode: 'table', serveAt: '{{dayLabel}}, {{slot|time}}' },
        text: 'Pre-ordering for your table for {{guests}} on {{dayLabel}} at {{slot|time}}. Your food will be served as you sit down.',
      },
      next: PLATTER,
    },
    {
      id: 'no-table',
      type: 'buttons',
      data: {
        text: 'You do not have a table booked with us yet, {{user.firstName}}. Would you like to book one, or order for takeaway?',
        buttons: [
          { id: 'book', title: 'Book a table' },
          { id: 'takeaway', title: 'Takeaway' },
          { id: 'menu', title: 'Main menu' },
        ],
      },
      next: { book: 'to-reserve', takeaway: 'pickup', menu: 'menu-end' },
    },
    { id: 'to-reserve', type: 'jump', data: { workflowKey: 'reserve' } },
    { id: 'menu-end', type: 'end', data: { showMenu: true } },
    {
      id: 'pickup',
      type: 'buttons',
      data: {
        text: 'When would you like to pick it up?',
        footer: 'Kitchen open 12 pm – 11 pm',
        buttons: [
          {
            id: 'p30',
            title: 'In 30 minutes',
            set: { mode: 'takeaway', serveAt: 'Pickup in 30 minutes' },
          },
          {
            id: 'p45',
            title: 'In 45 minutes',
            set: { mode: 'takeaway', serveAt: 'Pickup in 45 minutes' },
          },
          { id: 'p60', title: 'In 1 hour', set: { mode: 'takeaway', serveAt: 'Pickup in 1 hour' } },
        ],
      },
      next: { p30: PLATTER, p45: PLATTER, p60: PLATTER },
    },
    {
      id: PLATTER,
      type: 'carousel',
      data: {
        text: 'Our platters are made for sharing. Pick one:',
        cards: PLATTERS.map(platterCard),
      },
      next: Object.fromEntries(PLATTERS.map((p) => [p.id, DRINK])),
    },
    {
      id: DRINK,
      type: 'list',
      data: {
        text: '*{{platter}}* added. Something to drink with it?',
        button: 'Drinks',
        sections: [
          {
            id: 'jugs',
            title: 'Coolers',
            rows: DRINKS.map((d) => ({
              id: d.id,
              title: d.title,
              description: `${d.description} · ${rupees(d.price)}`,
              set: { drink: d.title, drinkPrice: String(d.price) },
            })),
          },
          {
            id: 'skip',
            title: 'No drinks',
            rows: [
              { id: 'none', title: 'No drinks, thanks', set: { drink: 'None', drinkPrice: '0' } },
            ],
          },
        ],
      },
      next: { ...Object.fromEntries(DRINKS.map((d) => [d.id, SPICE])), none: SPICE },
    },
    {
      id: SPICE,
      type: 'buttons',
      data: {
        text: 'How spicy do you like it?',
        footer: 'Tell the host about any allergies',
        buttons: [
          { id: 'mild', title: 'Mild', set: { spice: 'Mild' } },
          { id: 'medium', title: 'Medium', set: { spice: 'Medium' } },
          { id: 'hot', title: 'Spicy', set: { spice: 'Spicy' } },
        ],
      },
      next: { mild: 'with-drink', medium: 'with-drink', hot: 'with-drink' },
    },
    {
      id: 'with-drink',
      type: 'condition',
      data: {
        set: { orderId: '$id:STO', gst: '$price:90:30' },
        cases: [{ id: 'drink', var: 'drink', op: 'neq', value: 'None' }],
      },
      next: { drink: 'cart-2', else: 'cart-1' },
    },
    {
      id: 'cart-2',
      type: 'order',
      data: {
        order: {
          orderId: '{{orderId}}',
          title: 'Your pre-order',
          items: ITEMS,
          adjustments: TAXES,
          status: 'pending',
          payTitle: 'Pay now',
        },
      },
      next: { pay: 'paid-2' },
    },
    {
      id: 'paid-2',
      type: 'order',
      data: {
        order: {
          orderId: '{{orderId}}',
          title: 'Payment received',
          items: ITEMS,
          adjustments: TAXES,
          status: 'paid',
        },
      },
      next: 'invoice',
    },
    {
      id: 'cart-1',
      type: 'order',
      data: {
        order: {
          orderId: '{{orderId}}',
          title: 'Your pre-order',
          items: PLATTER_ONLY,
          adjustments: TAXES,
          status: 'pending',
          payTitle: 'Pay now',
        },
      },
      next: { pay: 'paid-1' },
    },
    {
      id: 'paid-1',
      type: 'order',
      data: {
        order: {
          orderId: '{{orderId}}',
          title: 'Payment received',
          items: PLATTER_ONLY,
          adjustments: TAXES,
          status: 'paid',
        },
      },
      next: 'invoice',
    },
    {
      id: 'invoice',
      type: 'document',
      data: {
        set: { paidAt: '$now' },
        document: {
          fileName: 'SaffronTable_Invoice.pdf',
          fileType: 'PDF',
          pages: 1,
          sizeKb: 74,
          preview: {
            title: 'Tax invoice',
            subtitle: 'The Saffron Table · GSTIN 07AAAFS0000S1Z2',
            sections: [
              {
                kind: 'fields',
                heading: 'Order',
                fields: [
                  { label: 'Customer', value: '{{user.fullName}}' },
                  { label: 'Order', value: '{{orderId}}' },
                  { label: 'Paid', value: '{{paidAt|date}}, {{paidAt|time}}' },
                  { label: 'Serve', value: '{{serveAt}}' },
                  { label: 'Spice level', value: '{{spice}}' },
                ],
              },
              {
                kind: 'table',
                heading: 'Items',
                columns: ['Item', 'Amount'],
                rows: [
                  { id: 'platter', cells: ['{{platter}}', '{{platterPrice|money}}'] },
                  { id: 'drink', cells: ['Drinks: {{drink}}', '{{drinkPrice|money}}'] },
                  { id: 'gst', cells: ['GST (5%)', '{{gst|money}}'] },
                  { id: 'offer', cells: ['Pre-order offer', '-₹100'] },
                ],
              },
            ],
            footer: 'Thank you for dining with The Saffron Table',
          },
        },
        caption: 'Your invoice, {{user.firstName}}.',
      },
      next: 'kitchen',
    },
    {
      id: 'kitchen',
      type: 'ticket',
      data: {
        complete: true,
        set: { kot: '$id:KOT' },
        ticket: {
          ticketId: '{{kot}}',
          title: 'Pre-order confirmed',
          subtitle: 'The Saffron Table, Hauz Khas Village',
          fields: [
            { label: 'Platter', value: '{{platter}}' },
            { label: 'Drinks', value: '{{drink}}' },
            { label: 'Spice', value: '{{spice}}' },
            { label: 'Serve', value: '{{serveAt}}' },
            { label: 'Paid', value: 'Online · {{orderId}}' },
          ],
          qrData: 'saffrontable://kot/{{kot}}',
        },
        caption: 'Show this QR to the host or at the takeaway counter.',
      },
      next: 'mode',
    },
    {
      id: 'mode',
      type: 'condition',
      data: { cases: [{ id: 'takeaway', var: 'mode', op: 'eq', value: 'takeaway' }] },
      next: { takeaway: 'counter', else: 'table-end' },
    },
    {
      id: 'table-end',
      type: 'end',
      data: { text: 'Done! Chef Rohit’s team will have it ready for you.', showMenu: true },
    },
    {
      id: 'counter',
      type: 'location',
      data: {
        location: {
          name: 'Takeaway counter',
          address: RESTAURANT.address,
          lat: RESTAURANT.lat,
          lng: RESTAURANT.lng,
        },
        caption: 'The takeaway counter is at the ground-floor entrance — no need to park.',
      },
      next: 'ready',
    },
    {
      id: 'ready',
      type: 'reminder',
      data: {
        afterMs: 18_000,
        label: 'Your order is ready',
        note: 'Real use: when the kitchen marks it packed.',
      },
      next: { next: 'cooking', later: 'packed' },
    },
    {
      id: 'cooking',
      type: 'end',
      data: {
        text: 'It is on the stove! We will message you here the moment it is packed.',
        showMenu: true,
      },
    },
    {
      id: 'packed',
      type: 'image',
      data: {
        image: { icon: 'bag', accent: 'orange', title: 'Order packed', subtitle: 'Counter 1' },
        caption:
          'Hi {{user.firstName}}, order {{kot}} is packed and waiting at the takeaway counter. Show the QR from earlier.',
      },
      next: 'packed-end',
    },
    { id: 'packed-end', type: 'end', data: { showMenu: true } },
  ],
});
