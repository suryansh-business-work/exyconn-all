/**
 * After the job: the GST invoice as a PDF (line items, warranty), then rate the technician
 * (review link, or a complaint to a supervisor), claim a free warranty revisit (problem → day
 * → slot → revisit ticket) or go back to the menu.
 */
import { defineWorkflow } from '../../author';
import { COMPANY, LAST_JOB, SUPPORT } from './data';
import { slotPicker } from './shared';

const RATE = 'rate';
const CLAIM = 'claim';

export const invoice = defineWorkflow({
  key: 'invoice',
  name: 'Invoice & warranty',
  description: 'Get your bill, rate the job or claim a free revisit',
  keywords: ['invoice', 'bill', 'receipt', 'warranty', 'rating', 'feedback', 'complaint'],
  nodes: [
    {
      id: 'intro',
      type: 'text',
      data: {
        set: {
          jobId: '$id:HE',
          invoiceNo: '$id:INV',
          completed: '$now',
          jobService: LAST_JOB.service,
          jobTech: LAST_JOB.technician,
        },
        text: 'Hi {{user.firstName}}, your *{{jobService}}* by {{jobTech}} is complete. Here is your invoice — the 30-day service warranty starts today.',
      },
      next: 'invoice-pdf',
    },
    {
      id: 'invoice-pdf',
      type: 'document',
      data: {
        document: {
          fileName: 'HomeEase_Invoice.pdf',
          fileType: 'PDF',
          pages: 2,
          sizeKb: 148,
          preview: {
            title: 'Tax invoice',
            subtitle: '{{jobService}}',
            sections: [
              {
                kind: 'fields',
                heading: 'Job',
                fields: [
                  { label: 'Invoice no.', value: '{{invoiceNo}}' },
                  { label: 'Booking', value: '{{jobId}}' },
                  { label: 'Customer', value: '{{user.fullName}}' },
                  { label: 'Completed', value: '{{completed|date}}, {{completed|time}}' },
                  { label: 'Technician', value: '{{jobTech}}' },
                  { label: 'Paid by', value: 'UPI' },
                ],
              },
              {
                kind: 'table',
                heading: 'Charges',
                columns: ['Item', 'Qty', 'Amount'],
                rows: LAST_JOB.lines.map((l) => ({ id: l.id, cells: [...l.cells] })),
              },
              {
                kind: 'text',
                heading: 'Warranty',
                text: '30 days on labour and 6 months on parts fitted by HomeEase. If the same problem comes back, claim a free revisit from this chat. The warranty does not cover new faults, power surges or tampering by others.',
              },
            ],
            footer: 'HomeEase Services · Baner, Pune · GSTIN 27AAACH0000A1Z5 (dummy)',
          },
        },
        caption: 'Invoice {{invoiceNo}} · paid in full. Keep it for your warranty.',
      },
      next: 'next-steps',
    },
    {
      id: 'next-steps',
      type: 'buttons',
      data: {
        text: 'How did it go, {{user.firstName}}?',
        footer: 'Invoices stay in this chat',
        buttons: [
          { id: 'rate', title: 'Rate the service' },
          { id: 'claim', title: 'Problem is back' },
          { id: 'menu', title: 'Main menu' },
        ],
      },
      next: { rate: RATE, claim: CLAIM, menu: 'menu-end' },
    },
    {
      id: RATE,
      type: 'buttons',
      data: {
        text: 'How would you rate {{jobTech}} and the service?',
        buttons: [
          { id: 'excellent', title: 'Excellent', set: { rating: '5' } },
          { id: 'good', title: 'Good', set: { rating: '4' } },
          { id: 'poor', title: 'Poor', set: { rating: '2' } },
        ],
      },
      next: { excellent: 'review', good: 'review', poor: 'poor' },
    },
    {
      id: 'review',
      type: 'cta',
      data: {
        complete: true,
        text: 'Thank you! Would you share a quick review? It helps {{jobTech}} and other families nearby.',
        actions: [{ kind: 'url', title: 'Write a review', url: COMPANY.review }],
      },
      next: 'review-end',
    },
    {
      id: 'review-end',
      type: 'end',
      data: { text: 'Thanks for choosing HomeEase, {{user.firstName}}.', showMenu: true },
    },
    {
      id: 'poor',
      type: 'input',
      data: {
        prompt: 'We are sorry. What went wrong?',
        var: 'feedback',
        kind: 'text',
        error: 'Please type a few words so we can look into it.',
      },
      next: 'poor-agent',
    },
    {
      id: 'poor-agent',
      type: 'handoff',
      data: {
        complete: true,
        set: { complaintId: '$id:CM' },
        agentName: SUPPORT.agentName,
        text: "Hi {{user.firstName}}, I'm Kavita, support lead at HomeEase. I've logged complaint {{complaintId}} about booking {{jobId}} and I'll call you within 2 hours to put it right.",
      },
      next: 'poor-end',
    },
    {
      id: 'poor-end',
      type: 'end',
      data: { showMenu: true },
    },
    {
      id: CLAIM,
      type: 'input',
      data: {
        prompt:
          'Sorry about that. Tell us what is happening again — e.g. "AC is dripping water again".',
        var: 'claimIssue',
        kind: 'text',
        error: 'Please type a few words about the problem.',
      },
      next: 'claim-ok',
    },
    {
      id: 'claim-ok',
      type: 'text',
      data: {
        set: { claimId: '$id:WR' },
        text: 'Warranty claim {{claimId}} is open. Booking {{jobId}} is within warranty, so the revisit is free — no visiting charge, no labour charge.',
      },
      next: 'w-day',
    },
    ...slotPicker({
      prefix: 'w-',
      next: 'claim-ticket',
      dayText: 'When should {{jobTech}} come back?',
      slotText: 'Free slots on {{dayLabel}}:',
    }),
    {
      id: 'claim-ticket',
      type: 'ticket',
      data: {
        complete: true,
        set: { otp: '$int:1000:9999' },
        ticket: {
          ticketId: '{{claimId}}',
          title: 'Free revisit booked',
          subtitle: '{{jobService}} · warranty',
          fields: [
            { label: 'Problem', value: '{{claimIssue}}' },
            { label: 'Technician', value: '{{jobTech}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Start code', value: '{{otp}}' },
            { label: 'Charge', value: 'Free (warranty)' },
          ],
          qrData: 'homeease://warranty/{{claimId}}?job={{jobId}}&slot={{slot}}',
        },
        caption: 'Share the start code when the technician arrives.',
      },
      next: 'claim-end',
    },
    {
      id: 'claim-end',
      type: 'end',
      data: {
        text: 'All set — {{jobTech}} will see you on {{dayLabel}} at {{slot|time}}.',
        showMenu: true,
      },
    },
    {
      id: 'menu-end',
      type: 'end',
      data: { showMenu: true },
    },
  ],
});
