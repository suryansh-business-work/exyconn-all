/**
 * Track my order: order number → live status and delivery date → change the delivery day,
 * see the delivery partner (contact card + live tracking link), or done.
 */
import { defineWorkflow } from '../../author';
import { BRAND } from './data';

export const track = defineWorkflow({
  key: 'track',
  name: 'Track my order',
  description: 'Live status, delivery date and partner details',
  keywords: ['track', 'where is my order', 'order status', 'delivery', 'shipment'],
  nodes: [
    {
      id: 'ask',
      type: 'input',
      data: {
        prompt:
          'Sure, {{user.firstName}}. Please type your order number — it starts with LH and is in your confirmation email.',
        var: 'trackNo',
        kind: 'text',
      },
      next: 'status',
    },
    {
      id: 'status',
      type: 'buttons',
      data: {
        set: {
          status: '$pick:Packed at our Bengaluru warehouse|Shipped and in transit|Out for delivery',
          trackEta: '$days:1',
        },
        header: 'Order {{trackNo|upper}}',
        text: 'Status: *{{status}}*\nExpected: {{trackEta|day}}, between 10 am and 6 pm.',
        buttons: [
          { id: 'reschedule', title: 'Change delivery day' },
          { id: 'partner', title: 'Delivery partner' },
          { id: 'ok', title: 'All good' },
        ],
      },
      next: { reschedule: 'day', partner: 'partner-card', ok: 'ok-end' },
    },
    {
      id: 'day',
      type: 'list',
      data: {
        text: 'Which day works better for you?',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 5, var: 'newDay' },
      },
      next: { pick: 'moved' },
    },
    {
      id: 'moved',
      type: 'end',
      data: {
        complete: true,
        text: 'Done — order {{trackNo|upper}} will now arrive on {{newDayLabel}}. You will get the delivery OTP that morning.',
        showMenu: true,
      },
    },
    {
      id: 'partner-card',
      type: 'contact',
      data: {
        set: { partnerName: '$pick:Ravi Kumar|Imran Shaikh|Suresh Gowda' },
        contact: {
          name: '{{partnerName}}',
          phone: '+91 98450 31207',
          role: 'Delivery partner',
          organisation: 'Lumio Express',
        },
      },
      next: 'live',
    },
    {
      id: 'live',
      type: 'cta',
      data: {
        complete: true,
        text: '{{partnerName}} is handling your delivery. Follow the van live on the map.',
        actions: [{ kind: 'url', title: 'Live tracking', url: BRAND.track }],
      },
      next: 'live-end',
    },
    { id: 'live-end', type: 'end', data: { showMenu: true } },
    {
      id: 'ok-end',
      type: 'end',
      data: {
        complete: true,
        text: 'Great! I will message you when it is out for delivery.',
        showMenu: true,
      },
    },
  ],
});
