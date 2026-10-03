/**
 * Doorstep pickup: registration → when, read by `ai` from free text ("kal shaam 5 baje") with
 * a day/slot picker as its fallback → trip type → address → pay → handover pass, driver card,
 * live tracking, and a "driver on the way" push with ready / late / cancel.
 */
import { defineWorkflow } from '../../author';
import { DEALER, PICKUP_DRIVER, PICKUP_OPTIONS } from './data';

const DAY = 'day';
const TRIP = 'trip';

export const pickup = defineWorkflow({
  key: 'pickup',
  name: 'Pickup request',
  description: 'We collect your car from home and bring it back',
  keywords: ['pickup', 'pick up', 'doorstep', 'collect my car', 'drop my car'],
  nodes: [
    {
      id: 'intro',
      type: 'text',
      data: {
        text: 'Doorstep pickup, {{user.firstName}}: a trained AutoNova driver collects your car, brings it to our Baner workshop and drops it back. Every trip is insured and GPS-tracked.',
      },
      next: 'vehicle',
    },
    {
      id: 'vehicle',
      type: 'input',
      data: {
        prompt: 'Which car should we collect? Please type the registration number.',
        var: 'vehicleNo',
        kind: 'text',
        error: 'Please type the full registration number, e.g. MH 12 AB 1234.',
      },
      next: 'when',
    },
    {
      id: 'when',
      type: 'ai',
      data: {
        set: { pickupAtMs: '' },
        prompt:
          'When should we pick it up? Type it your way — e.g. "kal shaam 5 baje" or "Saturday 10 am".',
        intents: [
          { id: 'time', description: 'The customer gives a day and/or time for the pickup' },
          { id: 'asap', description: 'As soon as possible, right now, or within the next hour' },
        ],
        entities: [{ name: 'pickupAt', kind: 'datetime', description: 'When to collect the car' }],
        retry: "Sorry, I couldn't read a time from that. Please pick one below.",
      },
      next: { time: 'has-time', asap: 'asap', fallback: DAY },
    },
    {
      id: 'has-time',
      type: 'condition',
      data: {
        note: 'The server adds pickupAtMs when it can read a date and time.',
        cases: [{ id: 'yes', var: 'pickupAtMs', op: 'notEmpty' }],
      },
      next: { yes: 'time-ok', else: DAY },
    },
    {
      id: 'time-ok',
      type: 'text',
      data: {
        set: { slot: '{{pickupAtMs}}', dayLabel: '{{pickupAtMs|day}}' },
        text: 'Got it — pickup on {{dayLabel}} at {{slot|time}}.',
      },
      next: TRIP,
    },
    {
      id: 'asap',
      type: 'text',
      data: {
        set: { slot: '$now', dayLabel: '{{slot|day}}' },
        text: 'Right away it is. Our nearest driver can usually reach you within 90 minutes.',
      },
      next: TRIP,
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day should we collect {{vehicleNo}}?',
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
        text: 'Pickup windows on {{dayLabel}} (IST). The driver arrives within 30 minutes of the time you pick.',
        button: 'Choose time',
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
          from: 8,
          to: 19,
          stepMin: 60,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: TRIP, 'other-day': DAY },
    },
    {
      id: TRIP,
      type: 'buttons',
      data: {
        text: 'Which trip do you need? Pickup + drop is free on services above ₹5,000 — the fee is refunded on your bill.',
        buttons: PICKUP_OPTIONS.map((o) => ({
          id: o.id,
          title: o.title,
          set: { trip: o.title, tripFee: String(o.fee) },
        })),
      },
      next: Object.fromEntries(PICKUP_OPTIONS.map((o) => [o.id, 'pincode'])),
    },
    {
      id: 'pincode',
      type: 'input',
      data: {
        prompt: 'Your 6-digit PIN code, please — we cover Pune and Pimpri-Chinchwad.',
        var: 'pincode',
        kind: 'pincode',
      },
      next: 'address',
    },
    {
      id: 'address',
      type: 'input',
      data: {
        prompt: 'And the full address — house or flat number, society, street and a landmark.',
        var: 'address',
        kind: 'text',
        error: 'Please type a little more of the address so our driver can find you.',
      },
      next: 'purpose',
    },
    {
      id: 'purpose',
      type: 'buttons',
      data: {
        text: 'What is the car coming in for?',
        buttons: [
          { id: 'service', title: 'Scheduled service', set: { purpose: 'Scheduled service' } },
          { id: 'repair', title: 'A repair', set: { purpose: 'Repair' } },
          { id: 'body', title: 'Dent or paint', set: { purpose: 'Body and paint' } },
        ],
      },
      next: { service: 'summary', repair: 'summary', body: 'summary' },
    },
    {
      id: 'summary',
      type: 'order',
      data: {
        set: { orderId: '$id:PU' },
        order: {
          orderId: '{{orderId}}',
          title: 'Doorstep pickup — {{vehicleNo}}',
          items: [{ id: 'trip', name: '{{trip}} · {{purpose}}', qty: 1, price: '{{tripFee}}' }],
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
          items: [{ id: 'trip', name: '{{trip}} · {{purpose}}', qty: 1, price: '{{tripFee}}' }],
          status: 'paid',
        },
      },
      next: 'pass',
    },
    {
      id: 'pass',
      type: 'ticket',
      data: {
        set: { pickupId: '$id:PK', handoverCode: '$int:1000:9999' },
        complete: true,
        ticket: {
          ticketId: '{{pickupId}}',
          title: 'Pickup confirmed',
          subtitle: 'AutoNova doorstep service',
          fields: [
            { label: 'Car', value: '{{vehicleNo}}' },
            { label: 'For', value: '{{purpose}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Trip', value: '{{trip}}' },
            { label: 'Address', value: '{{address}}, {{pincode}}' },
            { label: 'Handover code', value: '{{handoverCode}}' },
          ],
          qrData: 'autonova://pickup/{{pickupId}}?code={{handoverCode}}',
        },
        caption:
          'The driver scans this QR or asks for the handover code before taking the keys. Never hand over the car without it.',
      },
      next: 'driver-intro',
    },
    {
      id: 'driver-intro',
      type: 'text',
      data: {
        text: '{{user.firstName}}, Ganesh will collect {{vehicleNo}}. He wears an AutoNova uniform and photo ID, and records a walk-around video of the car before driving off.',
      },
      next: 'driver',
    },
    {
      id: 'driver',
      type: 'contact',
      data: {
        contact: {
          name: PICKUP_DRIVER.name,
          phone: PICKUP_DRIVER.phone,
          role: PICKUP_DRIVER.role,
          organisation: 'AutoNova Motors',
        },
      },
      next: 'track',
    },
    {
      id: 'track',
      type: 'cta',
      data: {
        text: 'Follow the trip live once Ganesh sets off.',
        actions: [
          { kind: 'url', title: 'Track pickup', url: DEALER.tracking },
          { kind: 'call', title: 'Call driver', phone: PICKUP_DRIVER.phone },
        ],
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 15_000,
        label: 'Driver on the way',
        note: 'Real use: when the driver starts the trip.',
      },
      next: { next: 'booked', later: 'arriving' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'Booked. We will message you here when the driver is on the way.',
        showMenu: true,
      },
    },
    {
      id: 'arriving',
      type: 'image',
      data: {
        image: {
          icon: 'car',
          accent: 'blue',
          title: 'Driver on the way',
          subtitle: 'About 10 minutes away',
        },
        caption:
          'Ganesh is about 10 minutes from {{address}} in {{vehicle}}. Keep the keys, RC copy and handover code {{handoverCode}} ready.',
        set: { vehicle: PICKUP_DRIVER.vehicle },
      },
      next: 'arrive-actions',
    },
    {
      id: 'arrive-actions',
      type: 'buttons',
      data: {
        text: 'Pickup {{pickupId}} · {{vehicleNo}}',
        buttons: [
          { id: 'ready', title: 'Car is ready' },
          { id: 'late', title: 'Need 30 more mins' },
          { id: 'cancel', title: 'Cancel pickup' },
        ],
      },
      next: { ready: 'ready', late: 'late', cancel: 'cancel' },
    },
    {
      id: 'ready',
      type: 'end',
      data: {
        text: 'Thanks, {{user.firstName}}. Ganesh will share the walk-around video here once he has the car.',
        showMenu: true,
      },
    },
    {
      id: 'late',
      type: 'end',
      data: {
        text: 'No problem — Ganesh will come back in 30 minutes. There is no extra charge.',
        showMenu: true,
      },
    },
    {
      id: 'cancel',
      type: 'buttons',
      data: {
        text: 'Cancel pickup {{pickupId}}? {{tripFee|money}} goes back to your original payment method in 3–5 working days.',
        buttons: [
          { id: 'yes', title: 'Yes, cancel', set: { refundId: '$id:RF' } },
          { id: 'keep', title: 'Keep it' },
        ],
      },
      next: { yes: 'cancelled', keep: 'ready' },
    },
    {
      id: 'cancelled',
      type: 'end',
      data: {
        text: 'Pickup cancelled. Refund reference: {{refundId}}.',
        showMenu: true,
      },
    },
  ],
});
