/**
 * Manage a booking: the booking made in this chat (or a sample one) → show the QR pass,
 * download the invoice, transfer to a friend, cancel for a refund, directions, or support.
 * "Something else" is read by an `ai` node that routes to the right action.
 */
import { defineWorkflow } from '../../author';
import { COMPANY, EVENTS, SUPPORT } from './data';

const ACTIONS = 'actions';
const MORE = 'more';
const QR = 'qr';
const TRANSFER = 't-name';
const REFUND = 'refund';
const SUPPORT_NODE = 'support';

/** A sample booking for customers who did not book in this chat. */
const SAMPLE = EVENTS[1];

export const myTickets = defineWorkflow({
  key: 'my-tickets',
  name: 'My tickets',
  description: 'Entry pass, invoice, transfer or refund',
  keywords: ['my ticket', 'my tickets', 'my booking', 'refund', 'transfer ticket', 'invoice', 'qr'],
  nodes: [
    {
      id: 'has-booking',
      type: 'condition',
      data: {
        note: 'Reuse the booking made in this chat; otherwise load a sample one.',
        cases: [{ id: 'none', var: 'bookingId', op: 'empty' }],
      },
      next: { none: 'sample', else: ACTIONS },
    },
    {
      id: 'sample',
      type: 'delay',
      data: {
        ms: 400,
        set: {
          bookingId: '$id:SL',
          orderId: '$id:SLP',
          eventKey: SAMPLE.key,
          event: SAMPLE.title,
          venue: SAMPLE.venue,
          venueAddress: SAMPLE.address,
          city: SAMPLE.city,
          gate: SAMPLE.gate,
          mapUrl: SAMPLE.map,
          ageLimit: SAMPLE.ageLimit,
          tier: SAMPLE.tiers[1].name,
          tierPrice: String(SAMPLE.tiers[1].price),
          qty: '2',
          convFee: '99',
          block: 'C',
          attendee: '{{user.fullName}}',
          day: '$days:3',
          dayLabel: '{{day|day}}',
          slotLabel: '7:30 pm',
        },
      },
      next: ACTIONS,
    },
    {
      id: ACTIONS,
      type: 'list',
      data: {
        header: 'Booking {{bookingId}}',
        text: '*{{event}}*\n{{dayLabel}} at {{slotLabel}} · {{venue}}, {{city}}\n{{qty}} × {{tier}} · in the name of {{attendee}}\nWhat would you like to do?',
        footer: 'Full refund up to 48 hours before the show',
        button: 'Options',
        sections: [
          {
            id: 'tickets',
            title: 'Your tickets',
            rows: [
              { id: 'qr', title: 'Show entry pass', description: 'QR for the gate' },
              { id: 'invoice', title: 'Download invoice', description: 'GST invoice as PDF' },
              {
                id: 'transfer',
                title: 'Transfer to a friend',
                description: 'Free, up to 2 hours before',
              },
              {
                id: 'refund',
                title: 'Cancel and refund',
                description: 'Full refund up to 48 hours before',
              },
            ],
          },
          {
            id: 'help',
            title: 'Help',
            rows: [
              {
                id: 'directions',
                title: 'Venue and directions',
                description: 'Maps, gate and parking',
              },
              { id: 'other', title: 'Something else', description: 'Tell us in your own words' },
              { id: 'agent', title: 'Talk to support', description: 'A person replies in minutes' },
            ],
          },
        ],
      },
      next: {
        qr: QR,
        invoice: 'invoice',
        transfer: TRANSFER,
        refund: REFUND,
        directions: 'directions',
        other: 'issue',
        agent: SUPPORT_NODE,
      },
    },
    {
      id: QR,
      type: 'ticket',
      data: {
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Entry pass',
          subtitle: '{{venue}}, {{city}}',
          fields: [
            { label: 'Event', value: '{{event}}' },
            { label: 'Name', value: '{{attendee}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Show', value: '{{slotLabel}}' },
            { label: 'Ticket', value: '{{tier}} × {{qty}}' },
            { label: 'Block', value: '{{block}}' },
            { label: 'Entry', value: '{{gate}}' },
            { label: 'Age limit', value: '{{ageLimit}}' },
          ],
          qrData: 'spotlight://pass/{{bookingId}}?qty={{qty}}',
        },
        caption: 'One QR admits all {{qty}} of you. Screenshots work at the gate.',
      },
      next: MORE,
    },
    {
      id: 'invoice',
      type: 'document',
      data: {
        document: {
          fileName: 'Spotlight_Tax_Invoice.pdf',
          fileType: 'PDF',
          pages: 1,
          sizeKb: 148,
          preview: {
            title: 'Tax invoice',
            subtitle: 'Spotlight Live Entertainment Pvt. Ltd. · GSTIN 29ABCDE1234F1Z5',
            sections: [
              {
                kind: 'fields',
                heading: 'Billed to',
                fields: [
                  { label: 'Name', value: '{{user.fullName}}' },
                  { label: 'Booking', value: '{{bookingId}}' },
                  { label: 'Order', value: '{{orderId}}' },
                  { label: 'Event', value: '{{event}}, {{dayLabel}}' },
                  { label: 'Place of supply', value: '{{city}}' },
                ],
              },
              {
                kind: 'table',
                heading: 'Items',
                columns: ['Item', 'Qty', 'Rate (incl. GST)'],
                rows: [
                  { id: 'tickets', cells: ['{{tier}} ticket', '{{qty}}', '{{tierPrice|money}}'] },
                  { id: 'fee', cells: ['Convenience fee', '1', '{{convFee|money}}'] },
                ],
              },
              {
                kind: 'text',
                heading: 'Tax',
                text: 'Admission to entertainment events attracts 18% GST (9% CGST + 9% SGST), included in the rates above. This is a computer-generated invoice and needs no signature.',
              },
            ],
            footer: `Spotlight Live · ${COMPANY.address}`,
          },
        },
        caption: 'Your GST invoice for booking {{bookingId}}.',
      },
      next: MORE,
    },
    {
      id: TRANSFER,
      type: 'input',
      data: {
        prompt: "Who are you passing the tickets to? Type your friend's full name.",
        var: 'friend',
        kind: 'name',
      },
      next: 't-phone',
    },
    {
      id: 't-phone',
      type: 'input',
      data: {
        prompt: "{{friend}}'s mobile number? We send the new pass there.",
        var: 'friendPhone',
        kind: 'phone',
      },
      next: 't-confirm',
    },
    {
      id: 't-confirm',
      type: 'buttons',
      data: {
        text: 'Transfer {{qty}} × {{tier}} for *{{event}}* to {{friend}} ({{friendPhone}})? Your current pass stops working once you confirm.',
        buttons: [
          { id: 'yes', title: 'Transfer', set: { transferId: '$id:TR' } },
          { id: 'no', title: 'Keep them' },
        ],
      },
      next: { yes: 't-pass', no: MORE },
    },
    {
      id: 't-pass',
      type: 'ticket',
      data: {
        complete: true,
        ticket: {
          ticketId: '{{transferId}}',
          title: 'Entry pass (transferred)',
          subtitle: '{{venue}}, {{city}}',
          fields: [
            { label: 'Event', value: '{{event}}' },
            { label: 'Name', value: '{{friend}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Show', value: '{{slotLabel}}' },
            { label: 'Ticket', value: '{{tier}} × {{qty}}' },
            { label: 'Entry', value: '{{gate}}' },
          ],
          qrData: 'spotlight://pass/{{transferId}}?qty={{qty}}',
        },
        caption: 'Done — {{friend}} has this pass on WhatsApp too.',
      },
      next: 't-note',
    },
    {
      id: 't-note',
      type: 'notice',
      data: { text: 'Pass {{bookingId}} is no longer valid.' },
      next: 't-end',
    },
    {
      id: 't-end',
      type: 'end',
      data: {
        text: 'Transferred. Thanks for passing the fun on, {{user.firstName}}!',
        showMenu: true,
      },
    },
    {
      id: REFUND,
      type: 'buttons',
      data: {
        text: 'Cancel booking {{bookingId}}? The ticket price ({{qty}} × {{tierPrice|money}}) goes back to your original payment method in 5–7 working days. The convenience fee is not refundable.',
        buttons: [
          { id: 'yes', title: 'Yes, cancel', set: { refundId: '$id:RF' } },
          { id: 'transfer', title: 'Transfer instead' },
          { id: 'keep', title: 'Keep tickets' },
        ],
      },
      next: { yes: 'refunded', transfer: TRANSFER, keep: MORE },
    },
    {
      id: 'refunded',
      type: 'end',
      data: {
        complete: true,
        text: 'Your booking is cancelled. Refund reference: {{refundId}}. We hope to see you at another show soon.',
        showMenu: true,
      },
    },
    {
      id: 'directions',
      type: 'cta',
      data: {
        text: '*{{venue}}*\n{{venueAddress}}\nEntry at {{gate}}. Doors open before the show; parking is limited, so a cab or metro is quicker.',
        actions: [
          { kind: 'url', title: 'Open in maps', url: '{{mapUrl}}' },
          { kind: 'call', title: 'Call helpdesk', phone: COMPANY.phone },
        ],
      },
      next: MORE,
    },
    {
      id: 'issue',
      type: 'ai',
      data: {
        prompt:
          'Sure — tell me what happened, in your own words. For example: "paisa kat gaya par ticket nahi aaya" or "can I change my show to Saturday?"',
        intents: [
          {
            id: 'missing',
            description: 'Paid or booked but cannot find or did not receive the ticket',
          },
          { id: 'refund', description: 'Wants to cancel or get money back' },
          { id: 'transfer', description: 'Wants to give the tickets to someone else' },
          {
            id: 'other',
            description: 'Anything else: change of show, payment problem, accessibility, complaint',
          },
        ],
        entities: [{ name: 'issue', kind: 'text', description: 'The problem in a few words' }],
        retry: 'Sorry, I did not quite get that. Here are the options again.',
      },
      next: {
        missing: 'resend',
        refund: REFUND,
        transfer: TRANSFER,
        other: SUPPORT_NODE,
        fallback: ACTIONS,
      },
    },
    {
      id: 'resend',
      type: 'text',
      data: { text: 'No worries — here is your pass again. It is also in the confirmation email.' },
      next: QR,
    },
    {
      id: SUPPORT_NODE,
      type: 'handoff',
      data: {
        complete: true,
        agentName: SUPPORT.agentName,
        text: 'Hi {{user.firstName}}, Kabir from Spotlight Live here. I have booking {{bookingId}} for {{event}} open. How can I help?',
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
          organisation: 'Spotlight Live',
        },
      },
      next: 'support-end',
    },
    {
      id: 'support-end',
      type: 'end',
      data: { showMenu: true },
    },
    {
      id: MORE,
      type: 'buttons',
      data: {
        text: 'Anything else with this booking?',
        buttons: [
          { id: 'options', title: 'Booking options' },
          { id: 'done', title: 'All done' },
        ],
      },
      next: { options: ACTIONS, done: 'done' },
    },
    {
      id: 'done',
      type: 'end',
      data: { text: 'Enjoy the show, {{user.firstName}}!', showMenu: true, complete: true },
    },
  ],
});
