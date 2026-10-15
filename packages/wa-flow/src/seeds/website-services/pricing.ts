/**
 * Pricing & engagement models: pick a model → how it works, who it suits and typical rates →
 * the rate card as a spreadsheet preview → get an estimate or talk to sales.
 */
import { defineWorkflow } from '../../author';
import { AGENCY, MODELS } from './data';

const MODEL_LIST = 'models';

export const pricing = defineWorkflow({
  key: 'pricing',
  name: 'Pricing & models',
  description: 'Fixed price, dedicated team, T&M or managed',
  keywords: ['pricing', 'rates', 'rate card', 'engagement model', 'hourly rate', 'retainer'],
  nodes: [
    {
      id: MODEL_LIST,
      type: 'list',
      data: {
        header: 'How we work',
        text: 'Pick the way of working that fits you. Every model comes with transparent reporting and no lock-in after the first milestone.',
        button: 'See models',
        sections: [
          {
            id: 'models',
            title: 'Engagement models',
            rows: MODELS.map((m) => ({
              id: m.id,
              title: m.title,
              description: m.description,
              set: { modelName: m.title, modelHow: m.how, modelBest: m.best, modelRate: m.rate },
            })),
          },
        ],
      },
      next: Object.fromEntries(MODELS.map((m) => [m.id, 'detail'])),
    },
    {
      id: 'detail',
      type: 'buttons',
      data: {
        header: '{{modelName}}',
        text: '{{modelHow}}\n\n*Best for:* {{modelBest}}\n*Typical:* {{modelRate}}',
        footer: 'Prices exclude GST',
        buttons: [
          { id: 'card', title: 'Full rate card' },
          { id: 'quote', title: 'Get an estimate' },
          { id: 'other', title: 'Other models' },
        ],
      },
      next: { card: 'rate-card', quote: 'to-estimate', other: MODEL_LIST },
    },
    {
      id: 'rate-card',
      type: 'document',
      data: {
        complete: true,
        document: {
          fileName: 'Northstar-Rate-Card-2026.xlsx',
          fileType: 'XLSX',
          pages: 2,
          sizeKb: 48,
          preview: {
            title: 'Rate card 2026',
            subtitle: 'Indicative rates in INR, exclusive of GST',
            sections: [
              {
                kind: 'table',
                heading: 'Roles',
                columns: ['Role', 'Per hour', 'Per month'],
                rows: [
                  { id: 'pm', cells: ['Project lead', '₹2,400', '₹3.2 lakh'] },
                  { id: 'design', cells: ['Product designer', '₹2,000', '₹2.6 lakh'] },
                  { id: 'eng', cells: ['Senior engineer', '₹2,800', '₹3.8 lakh'] },
                  { id: 'ai', cells: ['AI / ML engineer', '₹3,200', '₹4.4 lakh'] },
                  { id: 'qa', cells: ['QA engineer', '₹1,800', '₹2.2 lakh'] },
                  { id: 'devops', cells: ['DevOps engineer', '₹2,600', '₹3.5 lakh'] },
                ],
              },
              {
                kind: 'fields',
                heading: 'Good to know',
                fields: [
                  { label: 'Minimum engagement', value: '80 hours or one milestone' },
                  { label: 'Billing', value: 'Monthly or per milestone, 15-day terms' },
                  { label: 'Discount', value: '8% on 6-month commitments' },
                ],
              },
            ],
            footer: 'Rates reviewed every April. Fixed-price quotes are built from these rates.',
          },
        },
        caption:
          'Our 2026 rate card, {{user.firstName}}. Fixed-price quotes are built from the same numbers.',
      },
      next: 'links',
    },
    {
      id: 'links',
      type: 'cta',
      data: {
        text: 'Compare the models side by side on our website.',
        actions: [{ kind: 'url', title: 'Engagement models', url: AGENCY.pricing }],
      },
      next: 'after',
    },
    {
      id: 'after',
      type: 'buttons',
      data: {
        text: 'Ready for numbers on your own project?',
        buttons: [
          { id: 'quote', title: 'Get an estimate' },
          { id: 'sales', title: 'Talk to sales' },
          { id: 'done', title: 'All set' },
        ],
      },
      next: { quote: 'to-estimate', sales: 'to-sales', done: 'bye' },
    },
    { id: 'to-estimate', type: 'jump', data: { workflowKey: 'estimate' } },
    { id: 'to-sales', type: 'jump', data: { workflowKey: 'sales' } },
    { id: 'bye', type: 'end', data: { text: 'Happy to help. Anything else?', showMenu: true } },
  ],
});
