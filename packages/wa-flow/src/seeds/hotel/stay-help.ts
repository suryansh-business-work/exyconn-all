/**
 * Help during the stay: the guest types what they need ("AC not cooling in 214", "2 extra
 * towels") and an `ai` node routes it — housekeeping, maintenance (with a follow-up push),
 * in-room dining charged to the room, late checkout, or the duty manager. Text it cannot
 * read falls back to a list.
 */
import { defineWorkflow } from '../../author';
import type { Product } from '../../schema';
import { DUTY_MANAGER, IN_ROOM_DINING, LATE_CHECKOUT, type MenuItem } from './data';

const PICK = 'pick';
const DINING = 'dining';
const LATE = 'late';
const MANAGER = 'manager';
const HOUSEKEEPING = 'housekeeping';
const FIX = 'fix';

function dishCard(item: MenuItem): Product {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    price: item.price,
    image: { icon: item.icon, accent: 'amber', title: item.title },
    buttonTitle: 'Order',
    set: {
      dish: item.title,
      dishPrice: String(item.price),
      dishGst: String(Math.round(item.price * 0.05)),
    },
  };
}

export const stayHelp = defineWorkflow({
  key: 'stay-help',
  name: 'Help during your stay',
  description: 'Housekeeping, repairs, room service and late checkout',
  keywords: [
    'towels',
    'housekeeping',
    'room service',
    'not working',
    'late checkout',
    'complaint',
    'help',
  ],
  nodes: [
    {
      id: 'ask',
      type: 'ai',
      data: {
        set: { item: 'your request' },
        prompt:
          'Hi {{user.firstName}}, what do you need? Type it in your words with your room number — e.g. "2 extra towels in 214" or "AC not cooling".',
        intents: [
          { id: 'housekeeping', description: 'Towels, toiletries, cleaning, extra bed or pillows' },
          { id: 'maintenance', description: 'Something broken: AC, TV, Wi-Fi, hot water, lights' },
          { id: 'food', description: 'Room service, food or drinks to the room' },
          { id: 'late', description: 'Late checkout or extending the stay' },
          { id: 'complaint', description: 'A complaint, noise, safety, or wants the manager' },
        ],
        entities: [
          {
            name: 'item',
            kind: 'text',
            description: 'What they need or what is broken, in a few words',
          },
          { name: 'roomNo', kind: 'number', description: 'Room number, if given' },
        ],
        retry: 'Sorry, I did not catch that.',
      },
      next: {
        housekeeping: HOUSEKEEPING,
        maintenance: FIX,
        food: DINING,
        late: LATE,
        complaint: MANAGER,
        fallback: PICK,
      },
    },
    {
      id: PICK,
      type: 'list',
      data: {
        text: 'Please pick what you need:',
        button: 'Services',
        sections: [
          {
            id: 'services',
            title: 'In-stay services',
            rows: [
              {
                id: 'hk',
                title: 'Housekeeping',
                description: 'Towels, toiletries, cleaning',
                set: { item: 'Housekeeping' },
              },
              {
                id: 'fix',
                title: 'Something is not working',
                description: 'AC, TV, Wi-Fi, hot water',
                set: { item: 'Repair' },
              },
              {
                id: 'food',
                title: 'In-room dining',
                description: 'Goan and Indian favourites, 24 hours',
              },
              { id: 'late', title: 'Late checkout' },
              { id: 'manager', title: 'Talk to the manager' },
            ],
          },
        ],
      },
      next: { hk: HOUSEKEEPING, fix: FIX, food: DINING, late: LATE, manager: MANAGER },
    },
    {
      id: HOUSEKEEPING,
      type: 'condition',
      data: { cases: [{ id: 'no-room', var: 'roomNo', op: 'empty' }] },
      next: { 'no-room': 'hk-room', else: 'hk-done' },
    },
    {
      id: 'hk-room',
      type: 'input',
      data: {
        prompt: 'Which room are you in?',
        var: 'roomNo',
        kind: 'number',
        error: 'Please type the room number, e.g. 214.',
      },
      next: 'hk-done',
    },
    {
      id: 'hk-done',
      type: 'end',
      data: {
        complete: true,
        set: { requestId: '$id:HK', eta: '$pick:10|15|20' },
        text: 'On its way! Housekeeping will be at room {{roomNo}} in about {{eta}} minutes.\nRequest {{requestId}}: {{item}}.',
        showMenu: true,
      },
    },
    {
      id: FIX,
      type: 'condition',
      data: { cases: [{ id: 'no-room', var: 'roomNo', op: 'empty' }] },
      next: { 'no-room': 'fix-room', else: 'fix-ticket' },
    },
    {
      id: 'fix-room',
      type: 'input',
      data: {
        prompt: 'Sorry about that. Which room are you in?',
        var: 'roomNo',
        kind: 'number',
        error: 'Please type the room number, e.g. 214.',
      },
      next: 'fix-ticket',
    },
    {
      id: 'fix-ticket',
      type: 'ticket',
      data: {
        set: { requestId: '$id:MT' },
        ticket: {
          ticketId: '{{requestId}}',
          title: 'Repair request logged',
          subtitle: 'Engineering · Coral Bay Resort',
          fields: [
            { label: 'Room', value: '{{roomNo}}' },
            { label: 'Issue', value: '{{item}}' },
            { label: 'Technician', value: 'Joseph D’Costa' },
            { label: 'Arrives in', value: '15 minutes' },
          ],
          qrData: 'coralbay://maintenance/{{requestId}}',
        },
        caption:
          'Joseph from engineering is on his way. Would you like a fresh room meanwhile? Just reply here.',
      },
      next: 'fix-check',
    },
    {
      id: 'fix-check',
      type: 'reminder',
      data: {
        afterMs: 15_000,
        label: 'Is it fixed?',
        note: 'Real use: 30 minutes after the request.',
      },
      next: { next: 'fix-wait', later: 'fix-follow' },
    },
    {
      id: 'fix-wait',
      type: 'end',
      data: { text: 'We will check back with you shortly.', showMenu: true },
    },
    {
      id: 'fix-follow',
      type: 'buttons',
      data: {
        text: 'Hi {{user.firstName}}, did Joseph fix things in room {{roomNo}}?',
        buttons: [
          { id: 'yes', title: 'Yes, all good' },
          { id: 'no', title: 'Still not fixed' },
        ],
      },
      next: { yes: 'fix-ok', no: MANAGER },
    },
    {
      id: 'fix-ok',
      type: 'end',
      data: {
        complete: true,
        text: 'Great — sorry for the trouble. Enjoy your evening!',
        showMenu: true,
      },
    },
    {
      id: DINING,
      type: 'carousel',
      data: {
        text: 'In-room dining, 24 hours. Pick a dish — it is charged to your room.',
        cards: IN_ROOM_DINING.map(dishCard),
      },
      next: Object.fromEntries(IN_ROOM_DINING.map((d) => [d.id, 'dining-room'])),
    },
    {
      id: 'dining-room',
      type: 'condition',
      data: { cases: [{ id: 'no-room', var: 'roomNo', op: 'empty' }] },
      next: { 'no-room': 'dining-ask', else: 'dining-order' },
    },
    {
      id: 'dining-ask',
      type: 'input',
      data: {
        prompt: 'Which room should we bring it to?',
        var: 'roomNo',
        kind: 'number',
        error: 'Please type the room number, e.g. 214.',
      },
      next: 'dining-order',
    },
    {
      id: 'dining-order',
      type: 'order',
      data: {
        set: { orderId: '$id:IRD' },
        order: {
          orderId: '{{orderId}}',
          title: 'Room {{roomNo}} · in-room dining',
          items: [{ id: 'dish', name: '{{dish}}', qty: 1, price: '{{dishPrice}}' }],
          adjustments: [{ id: 'gst', label: 'GST (5%)', amount: '{{dishGst}}' }],
          status: 'pending',
          payTitle: 'Charge to room',
        },
      },
      next: { pay: 'dining-done' },
    },
    {
      id: 'dining-done',
      type: 'end',
      data: {
        complete: true,
        text: 'Ordered! Your {{dish}} will reach room {{roomNo}} in about 30 minutes. It is added to your room bill.',
        showMenu: true,
      },
    },
    {
      id: LATE,
      type: 'buttons',
      data: {
        text: 'Checkout is at 11 am. How late would you like to stay?',
        footer: 'Subject to availability',
        buttons: LATE_CHECKOUT.map((l) => ({
          id: l.id,
          title: l.title,
          set: { lateUntil: l.title, lateFee: String(l.fee) },
        })),
      },
      next: { one: 'late-free', three: 'late-order', six: 'late-order' },
    },
    {
      id: 'late-free',
      type: 'end',
      data: {
        complete: true,
        text: 'Done — your checkout is moved to 1 pm, on the house.',
        showMenu: true,
      },
    },
    {
      id: 'late-order',
      type: 'order',
      data: {
        set: { orderId: '$id:LCO' },
        order: {
          orderId: '{{orderId}}',
          title: 'Late checkout',
          items: [
            { id: 'late', name: 'Late checkout · {{lateUntil}}', qty: 1, price: '{{lateFee}}' },
          ],
          status: 'pending',
          payTitle: 'Charge to room',
        },
      },
      next: { pay: 'late-done' },
    },
    {
      id: 'late-done',
      type: 'end',
      data: {
        complete: true,
        text: 'Confirmed — checkout {{lateUntil}}. The charge is on your room bill.',
        showMenu: true,
      },
    },
    {
      id: MANAGER,
      type: 'handoff',
      data: {
        agentName: DUTY_MANAGER.agentName,
        text: "Hi {{user.firstName}}, I'm Priya, the duty manager. I'm sorry your stay isn't perfect — tell me what happened and I will personally sort it out.",
      },
      next: 'manager-card',
    },
    {
      id: 'manager-card',
      type: 'contact',
      data: {
        contact: {
          name: DUTY_MANAGER.name,
          phone: DUTY_MANAGER.phone,
          role: DUTY_MANAGER.role,
          organisation: 'Coral Bay Resort',
        },
      },
      next: 'manager-end',
    },
    { id: 'manager-end', type: 'end', data: { showMenu: true } },
  ],
});
