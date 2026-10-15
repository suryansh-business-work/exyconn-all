/**
 * Project estimate: project type → budget band → timeline → a budget-fit check (a large build
 * on a lean budget gets a phased-MVP suggestion) → name, email and phone → a PDF estimate with
 * phases and a price range → sample proposal / call sales → book a consultation.
 */
import { defineWorkflow } from '../../author';
import { AGENCY, PROJECT_TYPES } from './data';
import { estimateDoc } from './estimate-doc';
import { BUDGETS, TIMELINES } from './options';

const NAME = 'name';

export const estimate = defineWorkflow({
  key: 'estimate',
  name: 'Get a project estimate',
  description: 'A price range and timeline in two minutes',
  keywords: ['estimate', 'quote', 'quotation', 'how much', 'cost', 'price my project'],
  nodes: [
    {
      id: 'type',
      type: 'list',
      data: {
        header: 'Project estimate',
        text: 'Let us size your project, {{user.firstName}}. Four quick questions and you get a written estimate — no sales call needed. What are you building?',
        button: 'Project type',
        sections: [
          {
            id: 'types',
            title: 'Project types',
            rows: PROJECT_TYPES.map((p) => ({
              id: p.id,
              title: p.title,
              description: p.description,
              set: {
                projectType: p.title,
                estLow: String(p.low),
                estHigh: String(p.high),
                estWeeks: p.weeks,
                tier: p.tier,
              },
            })),
          },
        ],
      },
      next: Object.fromEntries(PROJECT_TYPES.map((p) => [p.id, 'budget'])),
    },
    {
      id: 'budget',
      type: 'buttons',
      data: {
        text: 'Great — a *{{projectType}}*. What budget have you set aside?',
        footer: 'A rough band is fine',
        buttons: BUDGETS.map((b) => ({
          id: b.id,
          title: b.title,
          set: { budgetBand: b.id, budgetLabel: b.title },
        })),
      },
      next: Object.fromEntries(BUDGETS.map((b) => [b.id, 'timeline'])),
    },
    {
      id: 'timeline',
      type: 'list',
      data: {
        text: 'And when would you like to start?',
        button: 'Choose timeline',
        sections: [
          {
            id: 'timelines',
            title: 'Start',
            rows: TIMELINES.map((t) => ({ ...t, set: { timelineLabel: t.title } })),
          },
        ],
      },
      next: Object.fromEntries(TIMELINES.map((t) => [t.id, 'fit'])),
    },
    {
      id: 'fit',
      type: 'condition',
      data: {
        set: { fitKey: '{{tier}}-{{budgetBand}}' },
        note: 'A large build on a lean budget gets a phased-MVP suggestion first.',
        cases: [{ id: 'phase', var: 'fitKey', op: 'eq', value: 'large-lean' }],
      },
      next: { phase: 'phased', else: NAME },
    },
    {
      id: 'phased',
      type: 'text',
      data: {
        text: 'Tip: a full {{projectType}} usually costs more than your budget band ({{budgetLabel}}). Most clients start with a focused MVP — the one journey that earns money — and grow it from real usage. We will show both options in your estimate.',
      },
      next: NAME,
    },
    {
      id: NAME,
      type: 'input',
      data: {
        prompt: 'Who should we address the estimate to? Your full name, please.',
        var: 'leadName',
        kind: 'name',
      },
      next: 'email',
    },
    {
      id: 'email',
      type: 'input',
      data: {
        prompt: 'Your work email? We send the PDF there as well.',
        var: 'leadEmail',
        kind: 'email',
        error: 'That email does not look right — please check and type it again.',
      },
      next: 'phone',
    },
    {
      id: 'phone',
      type: 'input',
      data: {
        prompt: 'And a phone number for the project lead to reach you on.',
        var: 'leadPhone',
        kind: 'phone',
      },
      next: 'doc',
    },
    estimateDoc,
    {
      id: 'links',
      type: 'cta',
      data: {
        text: 'See how a full proposal looks, or speak to our team right away.',
        actions: [
          { kind: 'url', title: 'Sample proposal', url: AGENCY.proposal },
          { kind: 'call', title: 'Call sales', phone: AGENCY.salesPhone },
        ],
      },
      next: 'after',
    },
    {
      id: 'after',
      type: 'buttons',
      data: {
        text: 'Want us to turn this into a fixed quote? A free 30-minute call is all it takes.',
        buttons: [
          { id: 'book', title: 'Book a free call' },
          { id: 'done', title: 'Not now' },
        ],
      },
      next: { book: 'to-consult', done: 'bye' },
    },
    {
      id: 'to-consult',
      type: 'jump',
      data: { set: { topic: '{{projectType}}' }, workflowKey: 'consult' },
    },
    {
      id: 'bye',
      type: 'end',
      data: {
        text: 'No rush — your estimate reference is {{estimateId}}. Anything else?',
        showMenu: true,
      },
    },
  ],
});
