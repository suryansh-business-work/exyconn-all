/**
 * Case studies: a carousel of client stories (engagement size as the price) → that story as a
 * PDF preview with the challenge, the build and before/after numbers → start a similar
 * project, read another story, or talk to sales.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import { CASE_STUDIES, type CaseStudy } from './case-data';

const CARDS = 'cards';
const NEXT_STEP = 'next-step';

function caseDoc(c: CaseStudy): AuthorNode {
  return {
    id: `doc-${c.id}`,
    type: 'document',
    data: {
      complete: true,
      set: { caseClient: c.client },
      document: {
        fileName: `Northstar-Case-Study-${c.id}.pdf`,
        fileType: 'PDF',
        pages: 6,
        sizeKb: 1480,
        preview: {
          title: c.title,
          subtitle: `${c.client} · ${c.industry} · delivered in ${c.weeks}`,
          sections: [
            { kind: 'text', heading: 'The challenge', text: c.challenge },
            { kind: 'text', heading: 'What we built', text: c.solution },
            {
              kind: 'table',
              heading: 'Results',
              columns: ['Metric', 'Before', 'After'],
              rows: c.metrics.map(([metric, before, after]) => ({
                id: metric.toLowerCase().replaceAll(/\W+/g, '-'),
                cells: [metric, before, after],
              })),
            },
            { kind: 'fields', heading: 'Stack', fields: [{ label: 'Technology', value: c.stack }] },
          ],
          footer:
            'Shared with the permission of the client. Figures measured 90 days after launch.',
        },
      },
      caption: 'The full story of how we helped {{caseClient}}.',
    },
    next: NEXT_STEP,
  };
}

export const caseStudies = defineWorkflow({
  key: 'case-studies',
  name: 'Case studies',
  description: 'Real results from fintech, retail, health and logistics',
  keywords: ['case study', 'case studies', 'portfolio', 'past work', 'clients', 'examples'],
  nodes: [
    {
      id: CARDS,
      type: 'carousel',
      data: {
        text: 'A few projects we are proud of. Each card shows the headline result and the engagement size.',
        cards: CASE_STUDIES.map((c) => ({
          id: c.id,
          title: c.title,
          subtitle: `${c.client} · ${c.industry}`,
          price: c.value,
          badge: c.result,
          image: { icon: c.icon, accent: 'indigo', title: c.client, subtitle: c.result },
          buttonTitle: 'Read the story',
        })),
      },
      next: Object.fromEntries(CASE_STUDIES.map((c) => [c.id, `doc-${c.id}`])),
    },
    ...CASE_STUDIES.map(caseDoc),
    {
      id: NEXT_STEP,
      type: 'buttons',
      data: {
        text: 'Have something similar in mind? We can estimate it today.',
        buttons: [
          { id: 'similar', title: 'Similar project' },
          { id: 'another', title: 'Another story' },
          { id: 'sales', title: 'Talk to sales' },
        ],
      },
      next: { similar: 'to-estimate', another: CARDS, sales: 'to-sales' },
    },
    { id: 'to-estimate', type: 'jump', data: { workflowKey: 'estimate' } },
    { id: 'to-sales', type: 'jump', data: { workflowKey: 'sales' } },
  ],
});
