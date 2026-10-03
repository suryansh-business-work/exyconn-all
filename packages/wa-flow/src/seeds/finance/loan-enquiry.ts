/**
 * Loan enquiry: product carousel → amount and tenure read by `ai` ("35 lakh for 20 years")
 * with an amount-band list as fallback → monthly income → employment → an eligibility
 * condition → indicative EMI and calculator link → callback consent → enquiry ticket → a
 * pre-approved offer push with its PDF → upload documents or talk to the relationship manager.
 */
import { defineWorkflow } from '../../author';
import type { Product } from '../../schema';
import {
  AMOUNT_BANDS,
  FIRM,
  INCOME_FLOOR,
  LOAN_TYPES,
  RELATIONSHIP_MANAGER,
  type LoanType,
} from './data';

const NEED = 'need';
const INCOME = 'income';
const RM = 'rm';

function loanCard(loan: LoanType): Product {
  return {
    id: loan.id,
    title: loan.title,
    subtitle: `${loan.subtitle} · from ${loan.rate}% p.a. · EMI per ₹1 lakh from`,
    price: loan.emiPerLakh,
    badge: loan.badge,
    image: { icon: loan.icon, accent: 'green', title: loan.title },
    buttonTitle: 'Check eligibility',
    set: {
      loanType: loan.title,
      rate: loan.rate,
      emiPerLakh: String(loan.emiPerLakh),
      maxTenure: String(loan.maxTenure),
      processingFee: String(loan.processingFee),
    },
  };
}

export const loanEnquiry = defineWorkflow({
  key: 'loan-enquiry',
  name: 'Loan enquiry',
  description: 'Check eligibility and EMIs for home, personal and more',
  keywords: ['loan', 'home loan', 'personal loan', 'emi', 'eligibility', 'borrow'],
  nodes: [
    {
      id: 'types',
      type: 'carousel',
      data: {
        text: 'Hi {{user.firstName}}, which loan are you looking for? We compare offers from 30+ partner banks and NBFCs at no cost to you.',
        cards: LOAN_TYPES.map(loanCard),
      },
      next: Object.fromEntries(LOAN_TYPES.map((l) => [l.id, NEED])),
    },
    {
      id: NEED,
      type: 'ai',
      data: {
        set: { amountLakh: '', tenureYears: '{{maxTenure}}' },
        prompt:
          'How much do you need, and for how long? Type it your way — e.g. "35 lakh for 20 years" or "around 5 lakh".',
        intents: [
          {
            id: 'amount',
            description: 'The customer states a loan amount, with or without a tenure',
          },
        ],
        entities: [
          {
            name: 'amountLakh',
            kind: 'number',
            description:
              'Loan amount in lakh rupees as a number, e.g. 35 for ₹35 lakh, 150 for ₹1.5 crore',
          },
          { name: 'tenureYears', kind: 'number', description: 'Tenure in years, if given' },
        ],
        retry: "Sorry, I couldn't read an amount from that. Please pick a range.",
      },
      next: { amount: 'has-amount', fallback: 'band' },
    },
    {
      id: 'has-amount',
      type: 'condition',
      data: { cases: [{ id: 'yes', var: 'amountLakh', op: 'notEmpty' }] },
      next: { yes: 'amount-ok', else: 'band' },
    },
    {
      id: 'amount-ok',
      type: 'text',
      data: { text: 'Got it — about ₹{{amountLakh}} lakh over {{tenureYears}} years.' },
      next: INCOME,
    },
    {
      id: 'band',
      type: 'list',
      data: {
        text: 'Roughly how much do you need?',
        button: 'Choose amount',
        sections: [
          {
            id: 'bands',
            title: 'Loan amount',
            rows: AMOUNT_BANDS.map((b) => ({
              id: b.id,
              title: b.title,
              set: { amountLakh: b.lakh },
            })),
          },
        ],
      },
      next: Object.fromEntries(AMOUNT_BANDS.map((b) => [b.id, INCOME])),
    },
    {
      id: INCOME,
      type: 'input',
      data: {
        prompt: 'What is your monthly take-home income in ₹? Just the number, e.g. 85000.',
        var: 'income',
        kind: 'number',
        error: 'Please type your monthly income as a number, e.g. 85000.',
      },
      next: 'employment',
    },
    {
      id: 'employment',
      type: 'buttons',
      data: {
        text: 'And how do you earn it?',
        buttons: [
          { id: 'salaried', title: 'Salaried', set: { employment: 'Salaried' } },
          { id: 'self', title: 'Self-employed', set: { employment: 'Self-employed professional' } },
          { id: 'business', title: 'Business owner', set: { employment: 'Business owner' } },
        ],
      },
      next: { salaried: 'eligible', self: 'eligible', business: 'eligible' },
    },
    {
      id: 'eligible',
      type: 'condition',
      data: {
        note: 'Partner banks ask for a minimum take-home income.',
        cases: [{ id: 'low', var: 'income', op: 'lt', value: String(INCOME_FLOOR) }],
      },
      next: { low: 'low-income', else: 'estimate' },
    },
    {
      id: 'low-income',
      type: 'buttons',
      data: {
        text: 'Most partner banks need a take-home of at least ₹25,000 a month for a {{loanType}}. Adding an earning co-applicant — a spouse or parent — usually solves this.',
        buttons: [
          { id: 'co', title: 'Add co-applicant' },
          { id: 'talk', title: 'Talk to an expert' },
          { id: 'later', title: 'Maybe later' },
        ],
      },
      next: { co: 'co-income', talk: RM, later: 'later' },
    },
    {
      id: 'co-income',
      type: 'input',
      data: {
        prompt: "The co-applicant's monthly take-home income in ₹?",
        var: 'coIncome',
        kind: 'number',
      },
      next: 'estimate',
    },
    {
      id: 'estimate',
      type: 'cta',
      data: {
        header: 'Your indicative estimate',
        text: '*Loan:* {{loanType}}, about ₹{{amountLakh}} lakh\n*Rate:* from {{rate}}% a year\n*EMI:* from {{emiPerLakh|money}} per ₹1 lakh over {{maxTenure}} years\n*Processing fee:* {{processingFee|money}}\nThe final rate depends on your credit score and documents.',
        footer: 'Indicative only · subject to credit appraisal',
        actions: [{ kind: 'url', title: 'EMI calculator', url: FIRM.emiCalculator }],
      },
      next: 'consent',
    },
    {
      id: 'consent',
      type: 'buttons',
      data: {
        text: 'Shall a loan expert call you with the best offers? We only check your credit score with your consent, and it does not affect the score.',
        buttons: [
          { id: 'yes', title: 'Yes, call me' },
          { id: 'no', title: 'Not now' },
        ],
      },
      next: { yes: 'phone-check', no: 'later' },
    },
    {
      id: 'phone-check',
      type: 'condition',
      data: { cases: [{ id: 'missing', var: 'user.phone', op: 'empty' }] },
      next: { missing: 'ask-phone', else: 'use-phone' },
    },
    {
      id: 'use-phone',
      type: 'delay',
      data: { ms: 300, set: { callPhone: '{{user.phone}}' } },
      next: 'ticket',
    },
    {
      id: 'ask-phone',
      type: 'input',
      data: { prompt: 'Which mobile number should we call?', var: 'callPhone', kind: 'phone' },
      next: 'ticket',
    },
    {
      id: 'ticket',
      type: 'ticket',
      data: {
        set: { enquiryId: '$id:KL' },
        complete: true,
        ticket: {
          ticketId: '{{enquiryId}}',
          title: 'Loan enquiry received',
          subtitle: 'Kosh Finserv · {{loanType}}',
          fields: [
            { label: 'Applicant', value: '{{user.fullName}}' },
            { label: 'Amount', value: '₹{{amountLakh}} lakh' },
            { label: 'Income', value: '{{income|money}} a month' },
            { label: 'Employment', value: '{{employment}}' },
            { label: 'Call on', value: '{{callPhone}}' },
          ],
          qrData: 'kosh://loan/{{enquiryId}}',
        },
        caption:
          'Harsh, your relationship manager, will call within 2 working hours. Quote this ID on the call.',
      },
      next: 'otp-notice',
    },
    {
      id: 'otp-notice',
      type: 'notice',
      data: { text: 'Kosh Finserv never asks for your OTP, PIN or card number on chat or calls.' },
      next: 'offer-wait',
    },
    {
      id: 'offer-wait',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Your loan offer is ready',
        note: 'Real use: after the credit check.',
      },
      next: { next: 'wait-end', later: 'offer' },
    },
    {
      id: 'wait-end',
      type: 'end',
      data: { text: 'We will send your offers here once the check is done.', showMenu: true },
    },
    {
      id: 'offer',
      type: 'document',
      data: {
        set: { offerId: '$id:OF', offerRate: '$pick:8.45|8.55|8.65|10.75|11.25' },
        document: {
          fileName: 'Kosh_Loan_Offer.pdf',
          fileType: 'PDF',
          pages: 2,
          sizeKb: 164,
          preview: {
            title: 'In-principle loan offer',
            subtitle: '{{loanType}}',
            sections: [
              {
                kind: 'fields',
                fields: [
                  { label: 'Applicant', value: '{{user.fullName}}' },
                  { label: 'Offer', value: '{{offerId}}' },
                  { label: 'Amount', value: 'Up to ₹{{amountLakh}} lakh' },
                  { label: 'Rate', value: '{{offerRate}}% a year, floating' },
                  { label: 'Tenure', value: 'Up to {{tenureYears}} years' },
                  { label: 'Processing fee', value: '{{processingFee|money}} + GST' },
                ],
              },
              {
                kind: 'table',
                heading: 'Offers compared',
                columns: ['Lender', 'Rate', 'Fee'],
                rows: [
                  { id: 'l1', cells: ['Partner bank A', '{{offerRate}}%', 'As above'] },
                  { id: 'l2', cells: ['Partner bank B', '+0.15%', 'Waived'] },
                  { id: 'l3', cells: ['Partner NBFC C', '+0.60%', '50% off'] },
                ],
              },
            ],
            footer: 'Valid for 30 days, subject to document verification.',
          },
        },
        caption:
          'Good news, {{user.firstName}} — you have an in-principle offer at {{offerRate}}% a year.',
      },
      next: 'offer-actions',
    },
    {
      id: 'offer-actions',
      type: 'buttons',
      data: {
        text: 'What would you like to do?',
        buttons: [
          { id: 'upload', title: 'Upload documents' },
          { id: 'rm', title: 'Talk to Harsh' },
          { id: 'later', title: 'Decide later' },
        ],
      },
      next: { upload: 'to-checklist', rm: RM, later: 'later' },
    },
    { id: 'to-checklist', type: 'jump', data: { workflowKey: 'document-checklist' } },
    {
      id: RM,
      type: 'handoff',
      data: {
        agentName: RELATIONSHIP_MANAGER.agentName,
        text: 'Hi {{user.firstName}}, Harsh from Kosh Finserv. I have your {{loanType}} enquiry here — let me walk you through the best offer and what the bank will need.',
      },
      next: 'rm-card',
    },
    {
      id: 'rm-card',
      type: 'contact',
      data: {
        contact: {
          name: RELATIONSHIP_MANAGER.name,
          phone: RELATIONSHIP_MANAGER.phone,
          role: RELATIONSHIP_MANAGER.role,
          organisation: 'Kosh Finserv',
        },
      },
      next: 'rm-end',
    },
    { id: 'rm-end', type: 'end', data: { showMenu: true } },
    {
      id: 'later',
      type: 'end',
      data: {
        text: 'No problem, {{user.firstName}}. Type *loan* any time to pick this up again.',
        showMenu: true,
      },
    },
  ],
});
