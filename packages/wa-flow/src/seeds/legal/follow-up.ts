/**
 * Case follow-up: the matter → status PDF (stage, past hearings, next date) → a hearing
 * reminder push with the court pin, a question for the advocate read by `ai` (answered here or
 * handed to the associate), or paying the fee instalment with a receipt.
 */
import { defineWorkflow } from '../../author';
import { ASSOCIATE, HEARINGS, SAMPLE_CASE } from './data';

const STATUS = 'status';
const ACTIONS = 'actions';
const PAY = 'pay';
const ASSOCIATE_NODE = 'associate';
const FEE_GST = Math.round(SAMPLE_CASE.feeDue * 0.18);

const feeItems = [{ id: 'fee', name: 'Fee instalment 2 of 4', qty: 1, price: SAMPLE_CASE.feeDue }];
const feeAdjustments = [{ id: 'gst', label: 'GST 18%', amount: FEE_GST }];

export const followUp = defineWorkflow({
  key: 'follow-up',
  name: 'Case follow-up',
  description: 'Case status, hearing dates, questions and fees',
  keywords: ['case status', 'hearing', 'next date', 'follow up', 'my case', 'update'],
  nodes: [
    {
      id: 'which',
      type: 'buttons',
      data: {
        text: 'Hi {{user.firstName}}, which matter would you like an update on?',
        buttons: [
          { id: 'open', title: 'My open matter', set: { caseRef: '$id:LX' } },
          { id: 'type', title: 'Type a reference' },
        ],
      },
      next: { open: STATUS, type: 'ref' },
    },
    {
      id: 'ref',
      type: 'input',
      data: {
        prompt: 'Please type the matter reference, e.g. LX-7KQ2M9.',
        var: 'caseRef',
        kind: 'text',
      },
      next: STATUS,
    },
    {
      id: STATUS,
      type: 'document',
      data: {
        set: {
          caseTitle: SAMPLE_CASE.title,
          forum: SAMPLE_CASE.forum,
          advocate: SAMPLE_CASE.advocate,
          stage: SAMPLE_CASE.stage,
          nextHearing: '$days:9',
        },
        document: {
          fileName: 'Lexora_Case_Status.pdf',
          fileType: 'PDF',
          pages: 2,
          sizeKb: 118,
          preview: {
            title: 'Case status',
            subtitle: '{{caseTitle}}',
            sections: [
              {
                kind: 'fields',
                fields: [
                  { label: 'Client', value: '{{user.fullName}}' },
                  { label: 'Matter', value: '{{caseRef|upper}}' },
                  { label: 'Forum', value: '{{forum}}' },
                  { label: 'Advocate', value: '{{advocate}}' },
                  { label: 'Stage', value: '{{stage}}' },
                  { label: 'Next hearing', value: '{{nextHearing|date}}, 10:30 am' },
                ],
              },
              {
                kind: 'table',
                heading: 'Hearings so far',
                columns: ['Date', 'Purpose', 'Outcome'],
                rows: HEARINGS.map((h) => ({ id: h.id, cells: [h.date, h.purpose, h.outcome] })),
              },
              {
                kind: 'text',
                heading: 'Where things stand',
                text: 'Pleadings are complete. At the next hearing we argue for delay compensation at the prescribed interest rate. Your presence is helpful but not required.',
              },
            ],
            footer: 'Prepared by Lexora Legal Associates for the client only.',
          },
        },
        caption:
          'Your matter {{caseRef|upper}} is next listed on {{nextHearing|date}} at 10:30 am.',
      },
      next: ACTIONS,
    },
    {
      id: ACTIONS,
      type: 'buttons',
      data: {
        text: 'What would you like to do?',
        buttons: [
          { id: 'remind', title: 'Hearing reminder' },
          { id: 'ask', title: 'Ask my advocate' },
          { id: 'pay', title: 'Pay fees' },
        ],
      },
      next: { remind: 'hearing-remind', ask: 'question', pay: PAY },
    },
    {
      id: 'hearing-remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Hearing tomorrow',
        note: 'Real use: the evening before the hearing.',
      },
      next: { next: 'remind-set', later: 'hearing-push' },
    },
    {
      id: 'remind-set',
      type: 'end',
      data: {
        complete: true,
        text: 'Done — we will remind you the evening before {{nextHearing|date}}.',
        showMenu: true,
      },
    },
    {
      id: 'hearing-push',
      type: 'location',
      data: {
        location: {
          name: SAMPLE_CASE.forum,
          address: SAMPLE_CASE.courtAddress,
          lat: SAMPLE_CASE.courtLat,
          lng: SAMPLE_CASE.courtLng,
        },
        caption:
          'Reminder: {{caseTitle}} is listed tomorrow at 10:30 am. {{advocate}} will be there by 10. Carry a photo ID; phones must be on silent in court.',
      },
      next: 'hearing-reply',
    },
    {
      id: 'hearing-reply',
      type: 'buttons',
      data: {
        text: 'Will you attend?',
        buttons: [
          { id: 'yes', title: 'I will attend' },
          { id: 'no', title: 'Not attending' },
        ],
      },
      next: { yes: 'attend', no: 'not-attend' },
    },
    {
      id: 'attend',
      type: 'end',
      data: { text: 'Great. Meet {{advocate}} outside courtroom 2 at 10 am.', showMenu: true },
    },
    {
      id: 'not-attend',
      type: 'end',
      data: {
        text: 'No problem. We will send you the order here once it is uploaded.',
        showMenu: true,
      },
    },
    {
      id: 'question',
      type: 'ai',
      data: {
        prompt:
          'Type your question for {{advocate}} — e.g. "how long will this take?" or "can we settle with the builder?"',
        intents: [
          { id: 'timeline', description: 'How long the case will take, or what happens next' },
          { id: 'settle', description: 'Settling, compromise or withdrawing the case' },
          { id: 'fees', description: 'Fees, invoices or payment' },
          { id: 'other', description: 'Any other question about the case' },
        ],
        entities: [],
        retry: 'Let me pass that to the team directly.',
      },
      next: {
        timeline: 'timeline',
        settle: ASSOCIATE_NODE,
        fees: PAY,
        other: ASSOCIATE_NODE,
        fallback: ASSOCIATE_NODE,
      },
    },
    {
      id: 'timeline',
      type: 'buttons',
      data: {
        text: 'Matters at this stage usually conclude within 2–3 hearings, so 3 to 5 months if the bench keeps its schedule. The next step is arguments on {{nextHearing|date}}. Did that answer your question?',
        buttons: [
          { id: 'yes', title: 'Yes, thanks' },
          { id: 'more', title: 'Ask a person' },
        ],
      },
      next: { yes: 'answered', more: ASSOCIATE_NODE },
    },
    {
      id: 'answered',
      type: 'end',
      data: { complete: true, text: 'Glad that helped, {{user.firstName}}.', showMenu: true },
    },
    {
      id: ASSOCIATE_NODE,
      type: 'handoff',
      data: {
        complete: true,
        agentName: ASSOCIATE.agentName,
        text: "Hi {{user.firstName}}, Kavita here from {{advocate}}'s team. I have {{caseRef|upper}} open — let me answer that properly. If it needs {{advocate}}, I will set up a short call.",
      },
      next: 'associate-end',
    },
    { id: 'associate-end', type: 'end', data: { showMenu: true } },
    {
      id: PAY,
      type: 'order',
      data: {
        set: { invoiceNo: '$id:FEE' },
        order: {
          orderId: '{{invoiceNo}}',
          title: 'Professional fees — {{caseRef|upper}}',
          items: feeItems,
          adjustments: feeAdjustments,
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
          orderId: '{{invoiceNo}}',
          title: 'Payment received',
          items: feeItems,
          adjustments: feeAdjustments,
          status: 'paid',
        },
      },
      next: 'receipt',
    },
    {
      id: 'receipt',
      type: 'document',
      data: {
        complete: true,
        set: { paidOn: '$now' },
        document: {
          fileName: 'Lexora_Fee_Receipt.pdf',
          fileType: 'PDF',
          pages: 1,
          sizeKb: 54,
          preview: {
            title: 'Fee receipt',
            subtitle: 'Lexora Legal Associates · GSTIN 07AAAFL0000L1Z2',
            sections: [
              {
                kind: 'fields',
                fields: [
                  { label: 'Receipt', value: '{{invoiceNo}}' },
                  { label: 'Client', value: '{{user.fullName}}' },
                  { label: 'Matter', value: '{{caseRef|upper}}' },
                  { label: 'Paid on', value: '{{paidOn|date}}' },
                ],
              },
            ],
            footer:
              'Instalments 3 and 4 fall due on filing of written arguments and on final order.',
          },
        },
        caption: 'Thank you. Your receipt is attached.',
      },
      next: 'paid-end',
    },
    { id: 'paid-end', type: 'end', data: { showMenu: true } },
  ],
});
