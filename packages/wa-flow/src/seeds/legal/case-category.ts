/**
 * Case category: the customer describes the matter in their own words and `ai` sorts it into
 * a practice area (an arrest goes to the urgent line); unreadable text falls back to a list.
 * Each area explains how we help and sends its document checklist, then offers a consultation
 * (jump, with the area kept), an associate, or the menu.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import { ASSOCIATE, areaVars, FIRM, PRACTICE_AREAS, type PracticeArea } from './data';

const PICK = 'pick';
const NEXT = 'next-step';
const URGENT = 'urgent';

/** "We can help" message for one area, setting the same variables as the consultation list. */
function areaIntro(area: PracticeArea): AuthorNode {
  return {
    id: `cat-${area.key}`,
    type: 'text',
    data: {
      set: areaVars(area),
      text: 'This sounds like a *{{area}}* matter. {{lawyer}} ({{lawyerTitle}}) leads this practice. Here is what to keep ready for your first meeting.',
    },
    next: `docs-${area.key}`,
  };
}

function areaChecklist(area: PracticeArea): AuthorNode {
  return {
    id: `docs-${area.key}`,
    type: 'document',
    data: {
      document: {
        fileName: 'Lexora_Document_Checklist.pdf',
        fileType: 'PDF',
        pages: 1,
        sizeKb: 64,
        preview: {
          title: 'Document checklist',
          subtitle: area.name,
          sections: [
            {
              kind: 'table',
              heading: 'Please bring or upload',
              columns: ['#', 'Document'],
              rows: area.documents.map((doc, i) => ({
                id: `d${i + 1}`,
                cells: [String(i + 1), doc],
              })),
            },
            {
              kind: 'text',
              heading: 'Note',
              text: 'Copies are fine for the first meeting. Keep originals safe — we will tell you if they are needed.',
            },
          ],
          footer: 'Lexora Legal Associates · general guidance, not legal advice',
        },
      },
      caption: 'Your checklist for a {{area}} matter.',
    },
    next: NEXT,
  };
}

export const caseCategory = defineWorkflow({
  key: 'case-category',
  name: 'Which lawyer do I need?',
  description: 'Describe your matter and we point you to the right team',
  keywords: ['which lawyer', 'case type', 'legal problem', 'help with a case', 'category'],
  nodes: [
    {
      id: 'disclaimer',
      type: 'notice',
      data: {
        text: 'This chat gives general information, not legal advice. Do not share passwords, OTPs or bank details here.',
      },
      next: 'describe',
    },
    {
      id: 'describe',
      type: 'ai',
      data: {
        prompt:
          'Tell us in your own words what has happened, {{user.firstName}} — e.g. "builder has delayed possession of my flat by two years" or "my employer has not paid my last two salaries".',
        intents: [
          {
            id: 'urgent',
            description: 'Someone has been arrested, detained or faces arrest today',
          },
          ...PRACTICE_AREAS.map((a) => ({ id: a.key, description: `${a.name}: ${a.description}` })),
        ],
        entities: [],
        retry: "Sorry, I couldn't place that. Please pick the closest area.",
      },
      next: {
        urgent: URGENT,
        ...Object.fromEntries(PRACTICE_AREAS.map((a) => [a.key, `cat-${a.key}`])),
        fallback: PICK,
      },
    },
    {
      id: PICK,
      type: 'list',
      data: {
        text: 'Which of these is closest to your matter?',
        button: 'Practice areas',
        sections: [
          {
            id: 'areas',
            title: 'Practice areas',
            rows: PRACTICE_AREAS.map((a) => ({
              id: a.key,
              title: a.name,
              description: a.description,
            })),
          },
        ],
      },
      next: Object.fromEntries(PRACTICE_AREAS.map((a) => [a.key, `cat-${a.key}`])),
    },
    ...PRACTICE_AREAS.map(areaIntro),
    ...PRACTICE_AREAS.map(areaChecklist),
    {
      id: NEXT,
      type: 'buttons',
      data: {
        text: 'How would you like to go ahead?',
        buttons: [
          { id: 'book', title: 'Book consultation' },
          { id: 'associate', title: 'Ask an associate' },
          { id: 'menu', title: 'Main menu' },
        ],
      },
      next: { book: 'to-consult', associate: 'associate', menu: 'menu-end' },
    },
    { id: 'to-consult', type: 'jump', data: { workflowKey: 'consultation' } },
    {
      id: 'associate',
      type: 'handoff',
      data: {
        complete: true,
        agentName: ASSOCIATE.agentName,
        text: "Hi {{user.firstName}}, I'm Kavita, an associate in our {{area}} team. Tell me a little more and I'll tell you honestly whether you need a full consultation.",
      },
      next: 'associate-end',
    },
    { id: 'associate-end', type: 'end', data: { showMenu: true } },
    {
      id: URGENT,
      type: 'cta',
      data: {
        header: 'Urgent legal help',
        text: 'For an arrest or detention, speak to our criminal team now — someone answers 24×7. Do not sign any statement before speaking to a lawyer.',
        actions: [{ kind: 'call', title: 'Call urgent line', phone: FIRM.urgent }],
      },
      next: 'urgent-handoff',
    },
    {
      id: 'urgent-handoff',
      type: 'handoff',
      data: {
        complete: true,
        agentName: 'Adv. Harpreet Gill (Criminal)',
        text: 'This is Harpreet Gill. Please tell me which police station, and when the person was taken — I will guide you on bail right away.',
      },
      next: 'urgent-end',
    },
    { id: 'urgent-end', type: 'end', data: { showMenu: true } },
    { id: 'menu-end', type: 'end', data: { showMenu: true } },
  ],
});
