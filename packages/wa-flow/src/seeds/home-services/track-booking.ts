/**
 * Track or change a booking: the booking made earlier in this chat, or one looked up by ID →
 * status timeline → technician's live location → reschedule (new QR), cancel with a reason
 * and refund, or a human from support.
 */
import { defineWorkflow } from '../../author';
import { CANCEL_REASONS, categoryOf, COMPANY, serviceVars, SUPPORT, TECH_LIVE } from './data';
import { slotPicker } from './shared';

const LIVE = 'live';
const ACTIONS = 'actions';

const AC = categoryOf('ac');

export const trackBooking = defineWorkflow({
  key: 'track-booking',
  name: 'Track my booking',
  description: 'Live status, reschedule or cancel a visit',
  keywords: ['track', 'status', 'where is technician', 'reschedule', 'cancel', 'my booking'],
  nodes: [
    {
      id: 'has-booking',
      type: 'condition',
      data: {
        note: 'Use the booking made earlier in this chat; otherwise ask for an ID.',
        cases: [{ id: 'mine', var: 'bookingId', op: 'notEmpty' }],
      },
      next: { mine: 'status-mine', else: 'ask-id' },
    },
    {
      id: 'ask-id',
      type: 'input',
      data: {
        prompt:
          'Please type your booking ID — you will find it on your confirmation, e.g. HE-4KQ7W2.',
        var: 'bookingId',
        kind: 'text',
        error: 'Please type the booking ID as it appears on your confirmation.',
      },
      next: 'lookup',
    },
    {
      id: 'lookup',
      type: 'delay',
      data: {
        ms: 600,
        note: 'Dummy job for a typed ID: an AC service with the technician already on the way.',
        set: { ...serviceVars(AC, AC.services[0]), otp: '$int:1000:9999' },
      },
      next: 'status-found',
    },
    {
      id: 'status-found',
      type: 'text',
      data: {
        text: '*Booking {{bookingId|upper}}* — {{service}}\n• Booked and paid\n• Technician assigned: {{techName}} ({{techRating}}★)\n• On the way to you now',
      },
      next: LIVE,
    },
    {
      id: 'status-mine',
      type: 'text',
      data: {
        text: '*Booking {{bookingId}}* — {{service}}\n• Booked: {{slot|day}} at {{slot|time}}\n• Technician assigned: {{techName}} ({{techRating}}★)\n• Start code: {{otp}}',
      },
      next: LIVE,
    },
    {
      id: LIVE,
      type: 'location',
      data: {
        set: { eta: '$int:8:25' },
        location: {
          name: '{{techName}} · live location',
          address: 'Baner–Pashan Link Road, Pune',
          lat: TECH_LIVE.lat,
          lng: TECH_LIVE.lng,
        },
        caption: 'Updated just now — {{techName}} is about {{eta}} minutes from your address.',
      },
      next: 'call',
    },
    {
      id: 'call',
      type: 'cta',
      data: {
        text: 'Need to give directions? Call {{techName}} or open live tracking.',
        actions: [
          { kind: 'call', title: 'Call technician', phone: '{{techPhone}}' },
          { kind: 'url', title: 'Live tracking', url: COMPANY.track },
        ],
      },
      next: ACTIONS,
    },
    {
      id: ACTIONS,
      type: 'buttons',
      data: {
        text: 'Anything you would like to change?',
        buttons: [
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'cancel', title: 'Cancel booking' },
          { id: 'support', title: 'Talk to support' },
        ],
      },
      next: { reschedule: 're-day', cancel: 'reason', support: 'support' },
    },
    ...slotPicker({
      prefix: 're-',
      next: 're-ticket',
      dayText: 'Pick a new day for your {{service}} — any payment carries over.',
      slotText: 'Free slots on {{dayLabel}}:',
    }),
    {
      id: 're-ticket',
      type: 'ticket',
      data: {
        complete: true,
        ticket: {
          ticketId: '{{bookingId|upper}}',
          title: 'Visit rescheduled',
          subtitle: '{{service}} · HomeEase Services',
          fields: [
            { label: 'Service', value: '{{service}}' },
            { label: 'New date', value: '{{dayLabel}}' },
            { label: 'New time', value: '{{slot|time}}' },
            { label: 'Technician', value: '{{techName}}' },
            { label: 'Start code', value: '{{otp}}' },
          ],
          qrData: 'homeease://job/{{bookingId}}?slot={{slot}}',
        },
        caption: 'Your old QR no longer works — use this one.',
      },
      next: 're-end',
    },
    {
      id: 're-end',
      type: 'end',
      data: { text: 'Done. Anything else, {{user.firstName}}?', showMenu: true },
    },
    {
      id: 'reason',
      type: 'list',
      data: {
        text: 'Sorry to see you cancel. Could you tell us why?',
        button: 'Choose reason',
        sections: [
          {
            id: 'reasons',
            title: 'Reasons',
            rows: CANCEL_REASONS.map((r) => ({ ...r, set: { cancelReason: r.title } })),
          },
        ],
      },
      next: Object.fromEntries(CANCEL_REASONS.map((r) => [r.id, 'cancel-confirm'])),
    },
    {
      id: 'cancel-confirm',
      type: 'buttons',
      data: {
        text: 'Cancel booking {{bookingId|upper}} for {{service}}? Anything you paid goes back to the original payment method in 3–5 working days.',
        buttons: [
          { id: 'yes', title: 'Yes, cancel', set: { refundId: '$id:RF' } },
          { id: 'keep', title: 'Keep booking' },
        ],
      },
      next: { yes: 'cancelled', keep: 'kept' },
    },
    {
      id: 'cancelled',
      type: 'end',
      data: {
        complete: true,
        text: 'Booking {{bookingId|upper}} is cancelled ({{cancelReason}}). Refund reference: {{refundId}}.',
        showMenu: true,
      },
    },
    {
      id: 'kept',
      type: 'end',
      data: { text: 'Great — your booking stays as it is.', showMenu: true },
    },
    {
      id: 'support',
      type: 'handoff',
      data: {
        complete: true,
        agentName: SUPPORT.agentName,
        text: "Hi {{user.firstName}}, I'm Kavita from HomeEase support. I have booking {{bookingId|upper}} open — what can I do for you?",
      },
      next: 'support-card',
    },
    {
      id: 'support-card',
      type: 'contact',
      data: {
        contact: {
          name: SUPPORT.name,
          phone: SUPPORT.phone,
          role: SUPPORT.role,
          organisation: 'HomeEase Services',
        },
      },
      next: 'support-end',
    },
    {
      id: 'support-end',
      type: 'end',
      data: { showMenu: true },
    },
  ],
});
