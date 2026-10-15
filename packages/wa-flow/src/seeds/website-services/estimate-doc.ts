/**
 * The estimate PDF the estimate workflow ends in: summary, phased delivery plan and what is
 * always included, filled from the visitor's answers.
 */
import type { AuthorNode } from '../../author';

export const estimateDoc: AuthorNode = {
  id: 'doc',
  type: 'document',
  data: {
    complete: true,
    set: { estimateId: '$id:EST' },
    document: {
      fileName: 'Northstar-Estimate-{{estimateId}}.pdf',
      fileType: 'PDF',
      pages: 4,
      sizeKb: 212,
      preview: {
        title: 'Project estimate',
        subtitle: '{{projectType}} · prepared for {{leadName}}',
        sections: [
          {
            kind: 'fields',
            heading: 'Summary',
            fields: [
              { label: 'Reference', value: '{{estimateId}}' },
              { label: 'Estimated range', value: '{{estLow|money}} – {{estHigh|money}}' },
              { label: 'Timeline', value: '{{estWeeks}}' },
              { label: 'Your budget', value: '{{budgetLabel}}' },
              { label: 'Preferred start', value: '{{timelineLabel}}' },
            ],
          },
          {
            kind: 'table',
            heading: 'Delivery plan',
            columns: ['Phase', 'What you get', 'Share'],
            rows: [
              {
                id: 'p1',
                cells: ['Discovery & design', 'Workshops, user flows, clickable prototype', '15%'],
              },
              {
                id: 'p2',
                cells: ['Build & integrate', 'Fortnightly releases on a staging link', '60%'],
              },
              {
                id: 'p3',
                cells: ['QA & launch', 'Testing, performance, security review', '15%'],
              },
              {
                id: 'p4',
                cells: ['Hypercare', '30 days of fixes and tuning after go-live', '10%'],
              },
            ],
          },
          {
            kind: 'text',
            heading: 'Always included',
            text: 'A dedicated project lead, weekly demos, source code and IP owned by you, WCAG 2.2 AA accessibility and a handover pack.',
          },
        ],
        footer:
          'Indicative estimate valid for 30 days. A fixed quote follows a free discovery call. Prices exclude GST.',
      },
    },
    caption: 'Here is your estimate, {{leadName}}. A copy is on its way to {{leadEmail}}.',
  },
  next: 'links',
};
