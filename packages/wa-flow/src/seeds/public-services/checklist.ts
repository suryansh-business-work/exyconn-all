/**
 * Document checklist: service → its checklist PDF (fee, timeline, counter and every document
 * with a note) → book a token for that service straight away, download the forms, or go back.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import {
  ALL_SERVICES,
  CIVIC,
  SERVICES,
  TRADE_LICENCE,
  serviceRow,
  type CivicService,
} from './data';

const NEXT = 'next-step';

function checklistDoc(service: CivicService): AuthorNode {
  return {
    id: `doc-${service.id}`,
    type: 'document',
    data: {
      complete: true,
      document: {
        fileName: `Checklist_${service.id}.pdf`,
        fileType: 'PDF',
        pages: 1,
        sizeKb: 84,
        preview: {
          title: '{{service}} — document checklist',
          subtitle: 'Sundarpur Civic Centre · citizen services',
          sections: [
            {
              kind: 'fields',
              fields: [
                { label: 'Fee', value: '{{feeLabel}}' },
                { label: 'Usually takes', value: '{{timeline}}' },
                { label: 'Counter', value: '{{counter}}' },
                { label: 'Prepared for', value: '{{user.fullName}}' },
              ],
            },
            {
              kind: 'table',
              heading: 'Bring these',
              columns: ['Document', 'Note'],
              rows: service.documents.map((d) => ({ id: d.id, cells: [d.doc, d.note] })),
            },
            {
              kind: 'text',
              heading: 'Before you visit',
              text: 'Bring the originals and one self-attested photocopy of each. Mask the first 8 digits of any Aadhaar copy. Forms are free at the counter and online.',
            },
          ],
          footer: 'sundarpur-civic.example/forms',
        },
      },
      caption: 'Here is everything you need for *{{service}}*. Fee: {{feeLabel}}.',
    },
    next: NEXT,
  };
}

export const checklist = defineWorkflow({
  key: 'checklist',
  name: 'Document checklist',
  description: 'What to bring for each service, fees and timelines',
  keywords: ['documents', 'checklist', 'what to bring', 'required documents', 'fees'],
  nodes: [
    {
      id: 'service',
      type: 'list',
      data: {
        header: 'Document checklist',
        text: 'Save a second trip, {{user.firstName}}. Pick a service and we will send the full list of documents to bring.',
        button: 'Choose service',
        sections: [{ id: 'services', title: 'Services', rows: ALL_SERVICES.map(serviceRow) }],
      },
      next: Object.fromEntries(ALL_SERVICES.map((s) => [s.id, 'route'])),
    },
    {
      id: 'route',
      type: 'condition',
      data: {
        note: 'One case per service; anything else is the trade licence.',
        cases: SERVICES.map((s) => ({
          id: s.id,
          var: 'serviceId',
          op: 'eq' as const,
          value: s.id,
        })),
      },
      next: {
        ...Object.fromEntries(SERVICES.map((s) => [s.id, `doc-${s.id}`])),
        else: `doc-${TRADE_LICENCE.id}`,
      },
    },
    ...ALL_SERVICES.map(checklistDoc),
    {
      id: NEXT,
      type: 'buttons',
      data: {
        text: 'Ready to apply?',
        buttons: [
          { id: 'token', title: 'Book a token', set: { svcFrom: 'checklist' } },
          { id: 'forms', title: 'Download forms' },
          { id: 'other', title: 'Another service' },
        ],
      },
      next: { token: 'to-token', forms: 'forms', other: 'service' },
    },
    {
      id: 'to-token',
      type: 'jump',
      data: { workflowKey: 'token' },
    },
    {
      id: 'forms',
      type: 'cta',
      data: {
        text: 'Fill the {{service}} form at home to save time at the counter.',
        actions: [
          { kind: 'url', title: 'Download forms', url: CIVIC.forms },
          { kind: 'call', title: 'Call help desk', phone: CIVIC.helpline },
        ],
      },
      next: 'forms-end',
    },
    {
      id: 'forms-end',
      type: 'end',
      data: { text: 'Type *token* whenever you are ready to visit.', showMenu: true },
    },
  ],
});
