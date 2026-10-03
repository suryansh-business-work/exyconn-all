/**
 * Sales qualification (BANT): four quick questions — Need, Budget, Authority, Timeline — or
 * the lead's own words read by an `ai` node. The answers score the lead: hot leads are routed
 * to a rep, warm ones get the pricing PDF, cold ones a guide and a nurture push later.
 */
import { defineWorkflow } from '../../author';
import { BUDGETS, COMPANY, NEEDS, PLANS } from './data';

const NEED = 'need';
const SCORE = 'score';
const WARM = 'warm';
const COLD = 'cold';
const HOT = 'hot';

export const qualify = defineWorkflow({
  key: 'qualify',
  name: 'Talk to sales',
  description: 'Four quick questions, then the right next step',
  keywords: ['sales', 'pricing', 'price', 'quote', 'buy', 'plans', 'cost'],
  nodes: [
    {
      id: 'how',
      type: 'buttons',
      data: {
        header: 'Talk to sales',
        text: 'Happy to help, {{user.firstName}}. Answer four quick questions so we connect you with the right person — or just tell us in your own words.',
        footer: 'Takes under a minute',
        buttons: [
          { id: 'quick', title: 'Quick questions' },
          { id: 'words', title: 'In my own words' },
          { id: 'pricing', title: 'Just the pricing' },
        ],
      },
      next: { quick: NEED, words: 'free', pricing: 'pricing' },
    },
    {
      id: NEED,
      type: 'list',
      data: {
        header: '1 of 4 · Need',
        text: 'What is the main problem you want to solve?',
        button: 'Choose one',
        sections: [
          {
            id: 'needs',
            title: 'Your challenge',
            rows: NEEDS.map((n) => ({ ...n, set: { need: n.title } })),
          },
        ],
      },
      next: Object.fromEntries(NEEDS.map((n) => [n.id, 'budget'])),
    },
    {
      id: 'budget',
      type: 'list',
      data: {
        header: '2 of 4 · Budget',
        text: 'Roughly what monthly budget have you set aside for this?',
        footer: 'Prices exclude 18% GST',
        button: 'Choose budget',
        sections: [
          {
            id: 'budgets',
            title: 'Monthly budget',
            rows: BUDGETS.map((b) => ({
              id: b.id,
              title: b.title,
              description: b.description,
              set: { budget: b.title, budgetFit: b.fit },
            })),
          },
        ],
      },
      next: Object.fromEntries(BUDGETS.map((b) => [b.id, 'authority'])),
    },
    {
      id: 'authority',
      type: 'buttons',
      data: {
        header: '3 of 4 · Authority',
        text: 'Who will make the final call on buying?',
        buttons: [
          { id: 'dm', title: 'I decide', set: { role: 'decider', roleLabel: 'Decision maker' } },
          {
            id: 'influencer',
            title: 'I recommend',
            set: { role: 'influencer', roleLabel: 'Recommends to the decision maker' },
          },
          {
            id: 'explorer',
            title: 'Just exploring',
            set: { role: 'explorer', roleLabel: 'Researching options' },
          },
        ],
      },
      next: { dm: 'timeline', influencer: 'timeline', explorer: 'timeline' },
    },
    {
      id: 'timeline',
      type: 'buttons',
      data: {
        header: '4 of 4 · Timeline',
        text: 'When do you want to go live?',
        buttons: [
          { id: 'month', title: 'This month', set: { urgency: 'hot', timeline: 'This month' } },
          {
            id: 'quarter',
            title: 'This quarter',
            set: { urgency: 'warm', timeline: 'This quarter' },
          },
          { id: 'later', title: 'Later this year', set: { urgency: 'cold', timeline: 'Later' } },
        ],
      },
      next: { month: 'recap', quarter: 'recap', later: 'recap' },
    },
    {
      id: 'recap',
      type: 'text',
      data: {
        text: 'Thanks, {{user.firstName}}. Here is what we noted:\n*Need:* {{need}}\n*Budget:* {{budget}}\n*Role:* {{roleLabel}}\n*Timeline:* {{timeline}}',
      },
      next: SCORE,
    },
    {
      id: SCORE,
      type: 'condition',
      data: {
        note: 'BANT score: a late timeline is cold; no budget or no authority is warm; else hot.',
        cases: [
          { id: 'late', var: 'urgency', op: 'eq', value: 'cold' },
          { id: 'no-budget', var: 'budgetFit', op: 'eq', value: 'no' },
          { id: 'no-authority', var: 'role', op: 'eq', value: 'explorer' },
        ],
      },
      next: { late: COLD, 'no-budget': WARM, 'no-authority': WARM, else: HOT },
    },
    {
      id: 'free',
      type: 'ai',
      data: {
        set: { seats: 'not shared yet', budget: 'not shared yet', timeline: 'not shared yet' },
        prompt:
          'Go ahead — tell us about your team and what you need. For example: "40 member sales team, budget around 50k a month, want to go live next month".',
        intents: [
          {
            id: 'ready',
            description: 'Has a clear need and budget and wants to start within about a month',
          },
          {
            id: 'evaluating',
            description: 'Comparing tools or planning for later this quarter or year',
          },
          { id: 'pricing', description: 'Only wants prices, plans or a quote' },
          { id: 'browsing', description: 'Just curious, a student or not buying any time soon' },
        ],
        entities: [
          { name: 'seats', kind: 'number', description: 'Number of users or team size' },
          {
            name: 'budget',
            kind: 'text',
            description: 'Monthly budget in rupees, e.g. "₹50,000 a month"',
          },
          {
            name: 'timeline',
            kind: 'text',
            description: 'When they want to go live, e.g. "next month"',
          },
        ],
        retry: "Sorry, I couldn't quite follow that — let's do the quick questions instead.",
      },
      next: {
        ready: 'ai-recap',
        evaluating: 'ai-warm',
        pricing: 'pricing',
        browsing: COLD,
        fallback: NEED,
      },
    },
    {
      id: 'ai-recap',
      type: 'text',
      data: {
        text: 'Got it, {{user.firstName}}:\n*Team size:* {{seats}}\n*Budget:* {{budget}}\n*Go-live:* {{timeline}}\nThat sounds like a great fit.',
      },
      next: HOT,
    },
    {
      id: 'ai-warm',
      type: 'text',
      data: {
        text: 'Thanks, noted.\n*Team size:* {{seats}}\n*Go-live:* {{timeline}}\nHere is our pricing to help you compare.',
      },
      next: 'pricing',
    },
    {
      id: HOT,
      type: 'notice',
      data: {
        complete: true,
        set: { leadScore: 'Hot', fromQualify: 'yes' },
        text: 'Priority lead — routing you to a sales rep now.',
      },
      next: 'to-routing',
    },
    {
      id: 'to-routing',
      type: 'jump',
      data: { workflowKey: 'routing' },
    },
    {
      id: WARM,
      type: 'text',
      data: {
        set: { leadScore: 'Warm' },
        text: 'Thanks, {{user.firstName}}. Here is our pricing so you can plan ahead — most teams start on Growth.',
      },
      next: 'pricing',
    },
    {
      id: 'pricing',
      type: 'document',
      data: {
        complete: true,
        document: {
          fileName: 'Orbitly_Pricing_2026.pdf',
          fileType: 'PDF',
          pages: 4,
          sizeKb: 638,
          preview: {
            title: 'Orbitly plans and pricing',
            subtitle: 'Per user per month, billed yearly · prices exclude 18% GST',
            sections: [
              {
                kind: 'fields',
                heading: 'Prepared for',
                fields: [
                  { label: 'Name', value: '{{user.fullName}}' },
                  { label: 'Email', value: '{{user.email}}' },
                  { label: 'Valid until', value: '31 March 2027' },
                ],
              },
              {
                kind: 'table',
                heading: 'Plans',
                columns: ['Plan', 'Price', 'Users', 'Highlights'],
                rows: PLANS.map((p) => ({
                  id: p.id,
                  cells: [p.name, p.price, p.seats, p.highlights],
                })),
              },
              {
                kind: 'text',
                heading: 'Included in every plan',
                text: 'Unlimited contacts, data stored in India, free migration from spreadsheets or another CRM, onboarding over video and 24×5 support. Monthly billing costs 20% more. Non-profits and early-stage startups get 30% off.',
              },
            ],
            footer: 'Orbitly Software Pvt. Ltd. · GSTIN 27ABCDE1234F1Z5 (dummy)',
          },
        },
        caption: 'Our 2026 pricing. Every plan comes with a 14-day free trial — no card needed.',
      },
      next: 'pricing-next',
    },
    {
      id: 'pricing-next',
      type: 'buttons',
      data: {
        text: 'What would you like to do next?',
        buttons: [
          { id: 'demo', title: 'Book a demo' },
          { id: 'rep', title: 'Talk to a rep', set: { fromQualify: 'yes' } },
          { id: 'trial', title: 'Start free trial' },
        ],
      },
      next: { demo: 'to-demo', rep: 'to-routing', trial: 'trial' },
    },
    {
      id: 'to-demo',
      type: 'jump',
      data: { workflowKey: 'demo' },
    },
    {
      id: 'trial',
      type: 'cta',
      data: {
        text: 'Your 14-day trial includes every Growth feature for up to 10 users. Sign up with {{user.email}} and you are in.',
        actions: [{ kind: 'url', title: 'Start free trial', url: COMPANY.trial }],
      },
      next: 'trial-end',
    },
    {
      id: 'trial-end',
      type: 'end',
      data: {
        text: 'Have fun exploring, {{user.firstName}}. Message us here if you get stuck.',
        showMenu: true,
      },
    },
    {
      id: COLD,
      type: 'document',
      data: {
        set: { leadScore: 'Nurture' },
        document: {
          fileName: 'Orbitly_Buyers_Guide.pdf',
          fileType: 'PDF',
          pages: 12,
          sizeKb: 2140,
          preview: {
            title: "The growing team's guide to CRM",
            subtitle: 'What to look for, what it costs and how long it takes',
            sections: [
              {
                kind: 'table',
                heading: 'Typical rollout',
                columns: ['Step', 'Time', 'Who'],
                rows: [
                  { id: 'import', cells: ['Import contacts and deals', '1 day', 'Orbitly team'] },
                  { id: 'pipes', cells: ['Set up pipelines', '2 days', 'Sales lead'] },
                  { id: 'wa', cells: ['Connect WhatsApp and email', '1 day', 'Admin'] },
                  { id: 'train', cells: ['Train the team', '1 week', 'Orbitly CSM'] },
                ],
              },
              {
                kind: 'text',
                heading: 'Checklist',
                text: 'Write down your sales stages, who owns each lead, the reports leadership asks for every Monday, and the tools you must connect. With that, most teams go live in under two weeks.',
              },
            ],
            footer: 'orbitly.example/guides',
          },
        },
        caption:
          'No rush, {{user.firstName}}. Here is our free buyers guide for when you are ready to plan.',
      },
      next: 'nurture',
    },
    {
      id: 'nurture',
      type: 'reminder',
      data: {
        afterMs: 25_000,
        label: 'A customer story for you',
        note: 'Real use: two weeks later.',
      },
      next: { next: 'cold-end', later: 'n-story' },
    },
    {
      id: 'cold-end',
      type: 'end',
      data: {
        text: 'We will check in later with a customer story. Type *sales* any time to pick up from here.',
        showMenu: true,
      },
    },
    {
      id: 'n-story',
      type: 'image',
      data: {
        image: {
          icon: 'star',
          accent: 'indigo',
          title: 'KiteKart: 3× faster replies',
          subtitle: 'D2C brand · 60 agents',
        },
        caption:
          'Hi {{user.firstName}}, KiteKart moved 60 agents to Orbitly in 9 days and now replies to WhatsApp leads 3× faster.',
      },
      next: 'n-cta',
    },
    {
      id: 'n-cta',
      type: 'buttons',
      data: {
        text: 'Would a 30-minute demo help you plan?',
        buttons: [
          { id: 'demo', title: 'Book a demo' },
          { id: 'later', title: 'Not now' },
        ],
      },
      next: { demo: 'to-demo', later: 'n-end' },
    },
    {
      id: 'n-end',
      type: 'end',
      data: { text: 'No problem. We are here whenever you need us.', showMenu: true },
    },
  ],
});
