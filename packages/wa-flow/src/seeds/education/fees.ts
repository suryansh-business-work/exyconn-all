/**
 * Fee reminder: the due instalment as a card → pay now (order with scholarship → receipt
 * PDF), remind me later (a push that comes back with the same choice), or EMI options that
 * go to the accounts desk.
 */
import { defineWorkflow } from '../../author';
import { rupees } from '../healthcare/data';
import { ACCOUNTS, FEE_PLAN } from './data';

const CHOICE = 'choice';
const PAY = 'pay';
const ITEMS = [{ id: 'due', name: 'Instalment 2 — {{feeCourse}}', qty: 1, price: FEE_PLAN.due }];
const RECEIPT_ROWS = FEE_PLAN.instalments.map((i) => ({
  id: i.id,
  cells: [i.label, rupees(i.amount), i.status === 'Due' ? 'Paid now' : i.status],
}));
const ADJUSTMENTS = [
  { id: 'scholarship', label: 'Scholarship (10%)', amount: -FEE_PLAN.scholarship },
];

export const fees = defineWorkflow({
  key: 'fees',
  name: 'Fee payment',
  description: 'See dues, pay instalments, get receipts and EMI help',
  keywords: ['fee', 'fees', 'pay fees', 'instalment', 'installment', 'receipt', 'emi', 'due'],
  nodes: [
    {
      id: 'due',
      type: 'image',
      data: {
        set: {
          studentId: '$id:BP',
          feeStudent: '$pick:Aarav Kulkarni|Ishita Joshi|Vihaan Deshpande',
          feeCourse: FEE_PLAN.course,
          feeBatch: FEE_PLAN.batch,
          feeDue: String(FEE_PLAN.due),
          feeScholarship: String(FEE_PLAN.scholarship),
          dueDate: '$days:5',
        },
        image: {
          icon: 'receipt',
          accent: 'indigo',
          title: 'Instalment 2 due',
          subtitle: '{{dueDate|day}}',
        },
        caption:
          'Hi {{user.firstName}}, a friendly reminder: instalment 2 for {{feeStudent}} ({{feeCourse}}, batch {{feeBatch}}) is due on {{dueDate|day}}.\nAmount: {{feeDue|money}}, less a {{feeScholarship|money}} scholarship.',
      },
      next: CHOICE,
    },
    {
      id: CHOICE,
      type: 'buttons',
      data: {
        text: 'Pay before the due date to avoid a ₹500 late fee.',
        footer: 'UPI, cards and net banking accepted',
        buttons: [
          { id: 'pay', title: 'Pay now' },
          { id: 'later', title: 'Remind me later' },
          { id: 'emi', title: 'EMI options' },
        ],
      },
      next: { pay: PAY, later: 'later', emi: 'emi' },
    },
    {
      id: PAY,
      type: 'order',
      data: {
        set: { orderId: '$id:BPF' },
        order: {
          orderId: '{{orderId}}',
          title: 'Fee payment · {{feeStudent}}',
          items: ITEMS,
          adjustments: ADJUSTMENTS,
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
        set: { paidAt: '$now' },
        order: {
          orderId: '{{orderId}}',
          title: 'Payment received',
          items: ITEMS,
          adjustments: ADJUSTMENTS,
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
        document: {
          fileName: 'BrightPath_Fee_Receipt.pdf',
          fileType: 'PDF',
          pages: 1,
          sizeKb: 92,
          preview: {
            title: 'Fee receipt',
            subtitle: 'BrightPath Academy · 2026–27',
            sections: [
              {
                kind: 'fields',
                heading: 'Student',
                fields: [
                  { label: 'Name', value: '{{feeStudent}}' },
                  { label: 'Student ID', value: '{{studentId}}' },
                  { label: 'Course', value: '{{feeCourse}}' },
                  { label: 'Receipt', value: '{{orderId}}' },
                  { label: 'Paid on', value: '{{paidAt|date}}' },
                ],
              },
              {
                kind: 'table',
                heading: 'Fee plan',
                columns: ['Instalment', 'Amount', 'Status'],
                rows: RECEIPT_ROWS,
              },
              {
                kind: 'text',
                heading: 'Note',
                text: 'Fees once paid are not refundable after the course starts. This receipt is valid for income-tax deduction under section 80C (tuition fees).',
              },
            ],
            footer: 'Computer-generated receipt — no signature needed',
          },
        },
        caption: 'Thank you! Here is your receipt.',
      },
      next: 'paid-end',
    },
    {
      id: 'paid-end',
      type: 'end',
      data: {
        text: 'All clear until the next instalment. We will remind you a week before.',
        showMenu: true,
      },
    },
    {
      id: 'later',
      type: 'reminder',
      data: {
        afterMs: 15_000,
        label: 'Fee due soon',
        note: 'Real use: 2 days before the due date.',
      },
      next: { next: 'later-ok', later: 'later-push' },
    },
    {
      id: 'later-ok',
      type: 'end',
      data: { text: 'Sure — we will remind you 2 days before {{dueDate|day}}.', showMenu: true },
    },
    {
      id: 'later-push',
      type: 'buttons',
      data: {
        header: 'Fee due in 2 days',
        text: 'Hi {{user.firstName}}, instalment 2 for {{feeStudent}} is due on {{dueDate|day}}. Pay now in under a minute.',
        buttons: [
          { id: 'pay', title: 'Pay now' },
          { id: 'emi', title: 'EMI options' },
        ],
      },
      next: { pay: PAY, emi: 'emi' },
    },
    {
      id: 'emi',
      type: 'list',
      data: {
        text: 'We can split this instalment for you:',
        button: 'EMI options',
        sections: [
          {
            id: 'options',
            title: 'Options',
            rows: [
              {
                id: 'card',
                title: '3-month no-cost EMI',
                description: 'On most credit cards',
                set: { emiPlan: '3-month no-cost EMI' },
              },
              {
                id: 'six',
                title: '6-month EMI',
                description: 'Through our education-loan partner',
                set: { emiPlan: '6-month EMI' },
              },
              {
                id: 'extend',
                title: 'Extend the due date',
                description: 'Up to 15 days, on request',
                set: { emiPlan: 'due-date extension' },
              },
            ],
          },
        ],
      },
      next: { card: 'accounts', six: 'accounts', extend: 'accounts' },
    },
    {
      id: 'accounts',
      type: 'handoff',
      data: {
        agentName: ACCOUNTS.agentName,
        text: "Hi {{user.firstName}}, Rahul from accounts. I can set up the {{emiPlan}} for {{feeStudent}}'s instalment — give me a minute to check eligibility.",
      },
      next: 'accounts-card',
    },
    {
      id: 'accounts-card',
      type: 'contact',
      data: {
        contact: {
          name: ACCOUNTS.name,
          phone: ACCOUNTS.phone,
          role: ACCOUNTS.role,
          organisation: 'BrightPath Academy',
        },
      },
      next: 'accounts-end',
    },
    { id: 'accounts-end', type: 'end', data: { showMenu: true } },
  ],
});
