/**
 * Membership enquiry: plan carousel (or "describe your needs", read by an `ai` node) → team
 * size → company → proposal PDF → book a tour, talk to the membership team, or "not now"
 * with a follow-up offer pushed later.
 */
import { defineWorkflow } from '../../author';
import type { Product } from '../../schema';
import { PLANS, SALES, gst, rupees, type Plan } from './data';

const SEATS = 'seats';
const QUOTE = 'quote';
const CUSTOM = 'custom';

function planCard(plan: Plan): Product {
  return {
    id: plan.id,
    title: plan.name,
    subtitle: `${plan.detail} · per seat / month`,
    price: plan.price,
    mrp: plan.mrp,
    badge: plan.badge,
    image: { icon: plan.icon, accent: 'amber', title: plan.name },
    buttonTitle: 'Get a quote',
    set: { plan: plan.name, planPrice: String(plan.price), planDetail: plan.detail },
  };
}

export const membership = defineWorkflow({
  key: 'membership',
  name: 'Membership plans',
  description: 'Desks, cabins and virtual offices, monthly',
  keywords: ['membership', 'plans', 'price', 'cabin', 'dedicated desk', 'virtual office'],
  nodes: [
    {
      id: 'plans',
      type: 'carousel',
      data: {
        text: 'Hi {{user.firstName}}, here are our monthly plans. Every plan includes Wi-Fi, coffee, printing and access to all Loftline centres on weekends.',
        cards: [
          ...PLANS.map(planCard),
          {
            id: CUSTOM,
            title: 'Something custom',
            subtitle: 'A whole floor, a team of 50, or a mix of plans',
            price: 0,
            badge: 'Tell us',
            image: { icon: 'chat', accent: 'slate', title: 'Custom' },
            buttonTitle: 'Describe needs',
          },
        ],
      },
      next: { ...Object.fromEntries(PLANS.map((p) => [p.id, SEATS])), [CUSTOM]: 'needs' },
    },
    {
      id: 'needs',
      type: 'ai',
      data: {
        set: {
          plan: 'Private cabin',
          planPrice: '13499',
          planDetail: 'Custom set-up',
          teamSize: 'To be confirmed',
          moveIn: 'To be confirmed',
        },
        prompt:
          'Tell us what you need — e.g. "cabin for 12 people in Baner from 1 November, budget around 1.5 lakh a month".',
        intents: [
          { id: 'quote', description: 'Describes seats, a budget, a location or a move-in date' },
          { id: 'tour', description: 'Wants to see the space first' },
          { id: 'talk', description: 'Wants to speak to a person or has a complex request' },
        ],
        entities: [
          { name: 'teamSize', kind: 'number', description: 'Number of seats or people' },
          { name: 'moveIn', kind: 'date', description: 'When they want to move in' },
          { name: 'budget', kind: 'text', description: 'Monthly budget in rupees' },
          { name: 'area', kind: 'location', description: 'Preferred city or area' },
        ],
        retry: "Sorry, I couldn't quite follow that. How many seats do you need?",
      },
      next: { quote: 'needs-recap', tour: 'to-tour', talk: 'sales', fallback: SEATS },
    },
    {
      id: 'needs-recap',
      type: 'text',
      data: {
        text: 'Thanks! Noted:\n*Seats:* {{teamSize}}\n*Move-in:* {{moveIn}}\nWe will price a {{plan}} as a starting point.',
      },
      next: 'company',
    },
    {
      id: SEATS,
      type: 'buttons',
      data: {
        text: 'How many seats do you need for the {{plan}}?',
        buttons: [
          { id: 'one', title: 'Just me', set: { teamSize: '1' } },
          { id: 'small', title: '2–10 seats', set: { teamSize: '2–10' } },
          { id: 'large', title: '10+ seats', set: { teamSize: '10+' } },
        ],
      },
      next: { one: 'company', small: 'company', large: 'company' },
    },
    {
      id: 'company',
      type: 'input',
      data: {
        prompt: 'And your company name, for the proposal?',
        var: 'company',
        kind: 'text',
        error: 'Please type your company name — at least 2 characters.',
      },
      next: QUOTE,
    },
    {
      id: QUOTE,
      type: 'document',
      data: {
        complete: true,
        set: { quoteId: '$id:QT' },
        document: {
          fileName: 'Loftline_Proposal.pdf',
          fileType: 'PDF',
          pages: 5,
          sizeKb: 1240,
          preview: {
            title: 'Membership proposal',
            subtitle: 'Prepared for {{company}}',
            sections: [
              {
                kind: 'fields',
                fields: [
                  { label: 'Proposal', value: '{{quoteId}}' },
                  { label: 'Contact', value: '{{user.fullName}}, {{user.email}}' },
                  { label: 'Plan', value: '{{plan}} — {{planDetail}}' },
                  { label: 'Seats', value: '{{teamSize}}' },
                  { label: 'Price per seat', value: '{{planPrice|money}} / month + GST' },
                ],
              },
              {
                kind: 'table',
                heading: 'All plans (per seat, per month, before GST)',
                columns: ['Plan', 'Price', 'GST', 'Includes'],
                rows: PLANS.map((p) => ({
                  id: p.id,
                  cells: [p.name, rupees(p.price), rupees(gst(p.price)), p.detail],
                })),
              },
              {
                kind: 'text',
                heading: 'Terms',
                text: 'Security deposit of two months, refundable. Lock-in of 3 months on desks and 6 months on cabins. 10% off on yearly plans. Prices valid for 15 days.',
              },
            ],
            footer: 'Loftline Workspaces · loftline.example',
          },
        },
        caption: 'Your proposal for {{company}}, {{user.firstName}}. Prices hold for 15 days.',
      },
      next: 'next',
    },
    {
      id: 'next',
      type: 'buttons',
      data: {
        text: 'What would you like to do next?',
        buttons: [
          { id: 'tour', title: 'Book a tour' },
          { id: 'talk', title: 'Talk to us' },
          { id: 'later', title: 'Not now' },
        ],
      },
      next: { tour: 'to-tour', talk: 'sales', later: 'follow-up' },
    },
    {
      id: 'to-tour',
      type: 'jump',
      data: { workflowKey: 'tour' },
    },
    {
      id: 'sales',
      type: 'handoff',
      data: {
        agentName: SALES.agentName,
        text: "Hi {{user.firstName}}, I'm Nikhil from Loftline memberships. I can hold space for you and work out a price that fits. Which centre and move-in date are you thinking of?",
      },
      next: 'sales-card',
    },
    {
      id: 'sales-card',
      type: 'contact',
      data: {
        contact: {
          name: SALES.name,
          phone: SALES.phone,
          role: SALES.role,
          organisation: 'Loftline Workspaces',
        },
      },
      next: 'sales-end',
    },
    {
      id: 'sales-end',
      type: 'end',
      data: { showMenu: true },
    },
    {
      id: 'follow-up',
      type: 'reminder',
      data: { afterMs: 20_000, label: 'An offer for you', note: 'Real use: three days later.' },
      next: { next: 'later-end', later: 'offer' },
    },
    {
      id: 'later-end',
      type: 'end',
      data: {
        text: 'No problem. Your proposal stays in this chat whenever you need it.',
        showMenu: true,
      },
    },
    {
      id: 'offer',
      type: 'image',
      data: {
        image: {
          icon: 'offer',
          accent: 'amber',
          title: 'First month 20% off',
          subtitle: 'This week only',
        },
        caption:
          'Hi {{user.firstName}}, still thinking it over? Sign up for a {{plan}} this week and get 20% off your first month.',
      },
      next: 'offer-next',
    },
    {
      id: 'offer-next',
      type: 'buttons',
      data: {
        text: 'Shall we hold a spot for {{company}}?',
        buttons: [
          { id: 'yes', title: 'Yes, call me' },
          { id: 'tour', title: 'Book a tour' },
          { id: 'no', title: 'No, thanks' },
        ],
      },
      next: { yes: 'sales', tour: 'to-tour', no: 'offer-end' },
    },
    {
      id: 'offer-end',
      type: 'end',
      data: { text: 'Thanks for letting us know. We are here when you need us.', showMenu: true },
    },
  ],
});
