/**
 * Day pass: centre → day → pass card → add-on (lunch, parking or none) → order with GST →
 * pay → QR pass and map pin → a check-in push on the day: check in for a desk number, or
 * cancel for a refund.
 */
import { defineWorkflow } from '../../author';
import { ADDONS, CENTRES, centreSections, gst } from './data';
import { centrePins } from './pins';

const PASS = 'day-pass';

export const dayPass = defineWorkflow({
  key: 'day-pass',
  name: 'Get a day pass',
  description: 'A hot desk for a day, from ₹449',
  keywords: ['day pass', 'hot desk', 'one day', 'work for a day', 'desk for today'],
  nodes: [
    {
      id: 'centre',
      type: 'list',
      data: {
        header: 'Day pass',
        text: 'Work from any Loftline for a day, {{user.firstName}} — fast Wi-Fi, unlimited coffee and a quiet desk. Which centre?',
        footer: 'Prices before 18% GST',
        button: 'Choose centre',
        sections: centreSections((c) => ({
          passPrice: String(c.dayPass),
          passGst: String(gst(c.dayPass)),
        })),
      },
      next: Object.fromEntries(CENTRES.map((c) => [c.id, 'day'])),
    },
    {
      id: 'day',
      type: 'list',
      data: {
        text: 'Which day would you like to come in?',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, var: 'day' },
      },
      next: { pick: PASS },
    },
    {
      id: PASS,
      type: 'product',
      data: {
        product: {
          id: PASS,
          title: 'Day pass · {{centre}}',
          subtitle: '{{dayLabel}}, 9 am – 9 pm · Wi-Fi, coffee, 20 printed pages',
          price: '{{passPrice}}',
          badge: 'No membership needed',
          image: { icon: 'ticket', accent: 'amber', title: 'Day pass', subtitle: '{{area}}' },
          buttonTitle: 'Buy pass',
        },
      },
      next: { [PASS]: 'addon' },
    },
    {
      id: 'addon',
      type: 'buttons',
      data: {
        text: 'Anything to add? Prices include GST.',
        buttons: ADDONS.map((a) => ({
          id: a.id,
          title: a.title,
          set: { addonLabel: a.label, addonPrice: String(a.price) },
        })),
      },
      next: Object.fromEntries(ADDONS.map((a) => [a.id, 'order'])),
    },
    {
      id: 'order',
      type: 'order',
      data: {
        set: { orderId: '$id:DP' },
        order: {
          orderId: '{{orderId}}',
          title: 'Day pass',
          items: [{ id: 'pass', name: 'Day pass — {{centre}}', qty: 1, price: '{{passPrice}}' }],
          adjustments: [
            { id: 'gst', label: 'GST (18%)', amount: '{{passGst}}' },
            { id: 'addon', label: '{{addonLabel}}', amount: '{{addonPrice}}' },
          ],
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
          items: [{ id: 'pass', name: 'Day pass — {{centre}}', qty: 1, price: '{{passPrice}}' }],
          adjustments: [
            { id: 'gst', label: 'GST (18%)', amount: '{{passGst}}' },
            { id: 'addon', label: '{{addonLabel}}', amount: '{{addonPrice}}' },
          ],
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
        set: { passId: '$id:PASS' },
        ticket: {
          ticketId: '{{passId}}',
          title: 'Day pass',
          subtitle: '{{centre}}',
          fields: [
            { label: 'Name', value: '{{user.fullName}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Hours', value: '9 am – 9 pm' },
            { label: 'Add-on', value: '{{addonLabel}}' },
            { label: 'Wi-Fi', value: 'Loftline-Members' },
          ],
          qrData: 'https://loftline.example/p/{{passId}}',
        },
        caption: 'Scan this QR at the gate. Any free hot desk is yours for the day.',
      },
      next: 'pin-route',
    },
    ...centrePins('pin', 'Walk in through the main lobby — the gate reads your pass QR.', 'remind'),
    {
      id: 'remind',
      type: 'reminder',
      data: { afterMs: 15_000, label: 'Your day pass is today', note: 'Real use: 8 am that day.' },
      next: { next: 'booked', later: 'checkin' },
    },
    {
      id: 'booked',
      type: 'end',
      data: { text: 'See you on {{dayLabel}}, {{user.firstName}}!', showMenu: true },
    },
    {
      id: 'checkin',
      type: 'buttons',
      data: {
        header: 'Good morning',
        text: 'Your day pass for {{centre}} is valid today. Check in from here to get a desk by the window.',
        buttons: [
          { id: 'in', title: 'Check in' },
          { id: 'cancel', title: "Can't make it" },
        ],
      },
      next: { in: 'checked-in', cancel: 'refund' },
    },
    {
      id: 'checked-in',
      type: 'end',
      data: {
        set: { desk: '$pick:W-12|W-14|W-21|B-07|B-09' },
        text: 'You are checked in. Your desk is *{{desk}}* by the window. Have a productive day!',
        showMenu: true,
      },
    },
    {
      id: 'refund',
      type: 'end',
      data: {
        set: { refundId: '$id:RF' },
        text: 'Pass {{passId}} is cancelled. The refund ({{refundId}}) reaches your account in 3–5 working days.',
        showMenu: true,
      },
    },
  ],
});
