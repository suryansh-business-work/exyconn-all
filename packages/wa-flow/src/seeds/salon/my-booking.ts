/**
 * Manage a booking: the appointment booked in this chat (or a sample one) as a QR ticket →
 * reschedule, cancel with a refund, running late, directions or the front desk. After the
 * visit a push asks for a rating and a review.
 */
import { defineWorkflow } from '../../author';
import { FRONT_DESK, SALON } from './data';

const ACTIONS = 'actions';

export const myBooking = defineWorkflow({
  key: 'my-booking',
  name: 'My appointment',
  description: 'Reschedule, cancel, running late or directions',
  keywords: [
    'my booking',
    'my appointment',
    'reschedule',
    'running late',
    'cancel booking',
    'directions',
  ],
  nodes: [
    {
      id: 'has-booking',
      type: 'condition',
      data: {
        note: 'Reuse a booking made in this chat; otherwise show a sample one.',
        cases: [{ id: 'none', var: 'bookingId', op: 'empty' }],
      },
      next: { none: 'sample', else: 'upcoming' },
    },
    {
      id: 'sample',
      type: 'delay',
      data: {
        ms: 400,
        set: {
          bookingId: '$id:GC',
          service: '$pick:Haircut and style|HydraFacial|Spa pedicure|Swedish massage',
          stylist: '$pick:Aarav Shah|Zoya Fernandes|Tanya D’Souza',
          day: '$days:2',
          slot: '{{day}}',
          dayLabel: '{{day|day}}',
        },
      },
      next: 'upcoming',
    },
    {
      id: 'upcoming',
      type: 'ticket',
      data: {
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Your next appointment',
          subtitle: 'Glow & Co., Bandra West',
          fields: [
            { label: 'Guest', value: '{{user.fullName}}' },
            { label: 'Service', value: '{{service}}' },
            { label: 'Stylist', value: '{{stylist}}' },
            { label: 'Date', value: '{{dayLabel}}' },
          ],
          qrData: 'glowandco://visit/{{bookingId}}',
        },
      },
      next: ACTIONS,
    },
    {
      id: ACTIONS,
      type: 'list',
      data: {
        text: 'What would you like to do with this booking, {{user.firstName}}?',
        button: 'Options',
        sections: [
          {
            id: 'change',
            title: 'Change',
            rows: [
              { id: 'reschedule', title: 'Reschedule', description: 'Free up to 3 hours before' },
              { id: 'cancel', title: 'Cancel booking', description: 'Full deposit refund' },
            ],
          },
          {
            id: 'day-of',
            title: 'On the day',
            rows: [
              { id: 'late', title: 'I’m running late', description: 'We will hold your chair' },
              { id: 'directions', title: 'Directions', description: 'Map pin and parking' },
              { id: 'done', title: 'I’ve had my visit', description: 'Tell us how it went' },
            ],
          },
          {
            id: 'help',
            title: 'Help',
            rows: [{ id: 'desk', title: 'Talk to the front desk' }],
          },
        ],
      },
      next: {
        reschedule: 'day',
        cancel: 'cancel',
        late: 'late',
        directions: 'pin',
        done: 'rate',
        desk: 'desk',
      },
    },
    {
      id: 'day',
      type: 'list',
      data: {
        text: 'Pick a new day for {{service}}:',
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
        text: 'Free slots with {{stylist}} on {{dayLabel}}:',
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
          from: 10,
          to: 21,
          stepMin: 30,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 'moved', 'other-day': 'day' },
    },
    {
      id: 'moved',
      type: 'ticket',
      data: {
        complete: true,
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Appointment rescheduled',
          subtitle: 'Glow & Co., Bandra West',
          fields: [
            { label: 'Service', value: '{{service}}' },
            { label: 'Stylist', value: '{{stylist}}' },
            { label: 'New date', value: '{{dayLabel}}' },
            { label: 'New time', value: '{{slot|time}}' },
          ],
          qrData: 'glowandco://visit/{{bookingId}}?slot={{slot}}',
        },
        caption: 'Use this new QR at reception.',
      },
      next: 'moved-end',
    },
    { id: 'moved-end', type: 'end', data: { text: 'All set. Anything else?', showMenu: true } },
    {
      id: 'cancel',
      type: 'buttons',
      data: {
        text: 'Cancel {{service}} on {{dayLabel}}? Any deposit you paid goes back to your original payment method in full.',
        buttons: [
          { id: 'yes', title: 'Yes, cancel', set: { refundId: '$id:RF' } },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'keep', title: 'Keep it' },
        ],
      },
      next: { yes: 'cancelled', reschedule: 'day', keep: 'kept' },
    },
    {
      id: 'cancelled',
      type: 'end',
      data: {
        complete: true,
        text: 'Cancelled. Refund reference {{refundId}} — 5–7 working days. We hope to see you soon, {{user.firstName}}.',
        showMenu: true,
      },
    },
    {
      id: 'kept',
      type: 'end',
      data: { text: 'Great, your booking stays as it is.', showMenu: true },
    },
    {
      id: 'late',
      type: 'buttons',
      data: {
        text: 'No worries! Roughly how late will you be?',
        buttons: [
          { id: 'ten', title: '10 minutes', set: { lateBy: '10' } },
          { id: 'twenty', title: '20 minutes', set: { lateBy: '20' } },
          { id: 'more', title: '30+ minutes' },
        ],
      },
      next: { ten: 'late-ok', twenty: 'late-ok', more: 'day' },
    },
    {
      id: 'late-ok',
      type: 'end',
      data: {
        complete: true,
        text: 'Thanks for letting us know. {{stylist}} will hold your chair for {{lateBy}} minutes. For anything longer we may need to move you to the next free slot.',
        showMenu: true,
      },
    },
    {
      id: 'pin',
      type: 'location',
      data: {
        location: { name: SALON.name, address: SALON.address, lat: SALON.lat, lng: SALON.lng },
        caption:
          'First floor, above the bakery. Valet parking on Hill Road from 11 am; Bandra station is 10 minutes away.',
      },
      next: 'pin-end',
    },
    { id: 'pin-end', type: 'end', data: { showMenu: true } },
    {
      id: 'rate',
      type: 'buttons',
      data: {
        text: 'How was your {{service}} with {{stylist}}?',
        buttons: [
          { id: 'loved', title: 'Loved it' },
          { id: 'okay', title: 'It was okay' },
          { id: 'unhappy', title: 'Not happy' },
        ],
      },
      next: { loved: 'review', okay: 'improve', unhappy: 'improve' },
    },
    {
      id: 'review',
      type: 'cta',
      data: {
        complete: true,
        text: 'Thank you! A quick Google review helps us a lot — and your next blow-dry is on us.',
        actions: [{ kind: 'url', title: 'Write a review', url: SALON.review }],
      },
      next: 'review-end',
    },
    {
      id: 'review-end',
      type: 'end',
      data: { text: 'See you next time, {{user.firstName}}!', showMenu: true },
    },
    {
      id: 'improve',
      type: 'input',
      data: {
        prompt: 'Sorry it was not perfect. What could we have done better?',
        var: 'feedback',
        kind: 'text',
      },
      next: 'improve-ack',
    },
    {
      id: 'improve-ack',
      type: 'end',
      data: {
        complete: true,
        set: { feedbackId: '$id:FB' },
        text: 'Thank you for telling us. Our salon manager will call you within a day (reference {{feedbackId}}) and make it right.',
        showMenu: true,
      },
    },
    {
      id: 'desk',
      type: 'handoff',
      data: {
        agentName: FRONT_DESK.agentName,
        text: 'Hi {{user.firstName}}, Riya here. I have booking {{bookingId}} open — how can I help?',
      },
      next: 'desk-end',
    },
    { id: 'desk-end', type: 'end', data: { showMenu: true } },
  ],
});
