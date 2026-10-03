/**
 * Home-loan EMI: loan amount → tenure (EMIs worked out per amount in data.ts) → EMI card →
 * pre-approval (income, employment, PIN code → request QR → loan advisor) or find homes.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import { rupees } from '../healthcare/data';
import { emi, LOAN_AMOUNTS, LOAN_DESK, LOAN_RATE, TENURES } from './data';

const RESULT = 'result';

/** One tenure picker per amount, so each button carries that amount's EMI. */
function tenureButtons(loan: (typeof LOAN_AMOUNTS)[number]): AuthorNode {
  return {
    id: `tenure-${loan.id}`,
    type: 'buttons',
    data: {
      text: 'Loan of {{loanTitle}}. Over how many years?',
      footer: `Indicative rate ${LOAN_RATE}% a year, floating`,
      buttons: TENURES.map((years) => ({
        id: `y${years}`,
        title: `${years} years`,
        set: { years: String(years), emi: String(emi(loan.amount, years)) },
      })),
    },
    next: Object.fromEntries(TENURES.map((years) => [`y${years}`, RESULT])),
  };
}

export const loan = defineWorkflow({
  key: 'loan',
  name: 'Home loan and EMI',
  description: 'Work out your EMI and get pre-approved in minutes',
  keywords: ['loan', 'home loan', 'emi', 'mortgage', 'interest rate', 'eligibility'],
  nodes: [
    {
      id: 'amount',
      type: 'list',
      data: {
        header: 'EMI calculator',
        text: 'How much would you like to borrow, {{user.firstName}}? Banks usually fund up to 80% of the home price.',
        button: 'Loan amount',
        sections: [
          {
            id: 'amounts',
            title: 'Loan amount',
            rows: LOAN_AMOUNTS.map((l) => ({
              id: l.id,
              title: l.title,
              description: `EMI from ${rupees(emi(l.amount, 25))}/month`,
              set: { loanTitle: l.title, loanAmount: String(l.amount) },
            })),
          },
        ],
      },
      next: Object.fromEntries(LOAN_AMOUNTS.map((l) => [l.id, `tenure-${l.id}`])),
    },
    ...LOAN_AMOUNTS.map(tenureButtons),
    {
      id: RESULT,
      type: 'image',
      data: {
        image: {
          icon: 'loan',
          accent: 'blue',
          title: '{{emi|money}} a month',
          subtitle: '{{loanTitle}} · {{years}} years',
        },
        caption: `Your EMI is about *{{emi|money}}* a month for {{loanTitle}} over {{years}} years at ${LOAN_RATE}%. Processing fee waived for Skyline buyers with our partner banks.`,
      },
      next: 'next',
    },
    {
      id: 'next',
      type: 'buttons',
      data: {
        text: 'What next?',
        buttons: [
          { id: 'approve', title: 'Get pre-approved' },
          { id: 'other', title: 'Try other amount' },
          { id: 'homes', title: 'Find homes' },
        ],
      },
      next: { approve: 'income', other: 'amount', homes: 'to-find' },
    },
    { id: 'to-find', type: 'jump', data: { workflowKey: 'find' } },
    {
      id: 'income',
      type: 'input',
      data: {
        prompt: 'Your monthly take-home income in rupees (numbers only, e.g. 150000)?',
        var: 'income',
        kind: 'number',
        error: 'Please type the amount in numbers only, e.g. 150000.',
      },
      next: 'employment',
    },
    {
      id: 'employment',
      type: 'buttons',
      data: {
        text: 'And you are…',
        buttons: [
          { id: 'salaried', title: 'Salaried', set: { employment: 'Salaried' } },
          { id: 'business', title: 'Self-employed', set: { employment: 'Self-employed' } },
        ],
      },
      next: { salaried: 'pin', business: 'pin' },
    },
    {
      id: 'pin',
      type: 'input',
      data: { prompt: 'Your current residence PIN code?', var: 'pincode', kind: 'pincode' },
      next: 'request',
    },
    {
      id: 'request',
      type: 'ticket',
      data: {
        complete: true,
        set: { loanRef: '$id:SKL' },
        ticket: {
          ticketId: '{{loanRef}}',
          title: 'Pre-approval requested',
          subtitle: 'Skyline Realty home-loan desk',
          fields: [
            { label: 'Applicant', value: '{{user.fullName}}' },
            { label: 'Loan', value: '{{loanTitle}} · {{years}} years' },
            { label: 'EMI', value: '{{emi|money}}/month' },
            { label: 'Income', value: '{{income|money}}/month' },
            { label: 'Employment', value: '{{employment}}' },
            { label: 'PIN code', value: '{{pincode}}' },
          ],
          qrData: 'skyline://loan/{{loanRef}}',
        },
        caption:
          'Offers from 3 partner banks usually arrive within 24 hours. No impact on your credit score at this stage.',
      },
      next: 'advisor',
    },
    {
      id: 'advisor',
      type: 'handoff',
      data: {
        agentName: LOAN_DESK.agentName,
        text: "Hi {{user.firstName}}, I'm Divya, your home-loan advisor. I'll need your last 3 payslips (or 2 years' ITR) and PAN to get the offers going. You can share them here when ready.",
      },
      next: 'advisor-card',
    },
    {
      id: 'advisor-card',
      type: 'contact',
      data: {
        contact: {
          name: LOAN_DESK.name,
          phone: LOAN_DESK.phone,
          role: LOAN_DESK.role,
          organisation: 'Skyline Realty',
        },
      },
      next: 'advisor-end',
    },
    { id: 'advisor-end', type: 'end', data: { showMenu: true } },
  ],
});
