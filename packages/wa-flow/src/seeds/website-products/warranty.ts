/**
 * Warranty: register a product (serial number + purchase date → a warranty certificate PDF)
 * or make a claim (serial number → problem → a claim ticket → a support engineer joins).
 */
import { defineWorkflow } from '../../author';
import { BRAND } from './data';

const PROBLEMS = [
  { id: 'power', title: 'Will not turn on', description: 'No lights, no sound, no response' },
  { id: 'wifi', title: 'Keeps disconnecting', description: 'Drops off Wi-Fi or the app' },
  { id: 'battery', title: 'Battery drains fast', description: 'Lasts much less than it should' },
  { id: 'other', title: 'Something else', description: 'Describe it to our engineer' },
] as const;

export const warranty = defineWorkflow({
  key: 'warranty',
  name: 'Warranty & claims',
  description: 'Register for an extra 6 months, or raise a claim',
  keywords: ['warranty', 'guarantee', 'claim', 'register product', 'repair', 'defect'],
  nodes: [
    {
      id: 'choose',
      type: 'buttons',
      data: {
        header: 'Warranty',
        text: 'Every Lumio product has a 1-year warranty — register it and we add 6 months free. What would you like to do?',
        buttons: [
          { id: 'register', title: 'Register product' },
          { id: 'claim', title: 'Make a claim' },
        ],
      },
      next: { register: 'serial', claim: 'claim-serial' },
    },
    {
      id: 'serial',
      type: 'input',
      data: {
        prompt:
          'Type the serial number — it is on the box and under the product, starting with LM.',
        var: 'serialNo',
        kind: 'text',
      },
      next: 'bought',
    },
    {
      id: 'bought',
      type: 'input',
      data: {
        prompt: 'When did you buy it? Type the date as DD/MM/YYYY, e.g. 12/08/2026.',
        var: 'boughtOn',
        kind: 'date',
        past: true,
        error: 'Please type a past date as DD/MM/YYYY, e.g. 12/08/2026.',
      },
      next: 'certificate',
    },
    {
      id: 'certificate',
      type: 'document',
      data: {
        complete: true,
        set: { warrantyId: '$id:WR' },
        document: {
          fileName: 'Lumio-Warranty-{{warrantyId}}.pdf',
          fileType: 'PDF',
          pages: 1,
          sizeKb: 96,
          preview: {
            title: 'Warranty certificate',
            subtitle: 'Lumio Home · 18 months total cover',
            sections: [
              {
                kind: 'fields',
                fields: [
                  { label: 'Certificate', value: '{{warrantyId}}' },
                  { label: 'Owner', value: '{{user.fullName}}' },
                  { label: 'Serial number', value: '{{serialNo|upper}}' },
                  { label: 'Purchased on', value: '{{boughtOn|date}}' },
                  { label: 'Cover', value: '12 months standard + 6 months bonus' },
                ],
              },
              {
                kind: 'text',
                heading: 'What is covered',
                text: 'Manufacturing defects, free pickup and repair or replacement, and phone support from our home experts.',
              },
            ],
            footer: 'Physical damage, liquid damage and unauthorised repairs are not covered.',
          },
        },
        caption: 'Registered! Your warranty now runs 18 months from {{boughtOn|date}}.',
      },
      next: 'reg-end',
    },
    {
      id: 'reg-end',
      type: 'end',
      data: { text: 'Anything else I can help with?', showMenu: true },
    },
    {
      id: 'claim-serial',
      type: 'input',
      data: {
        prompt: 'Sorry to hear that. What is the serial number? It starts with LM.',
        var: 'serialNo',
        kind: 'text',
      },
      next: 'problem',
    },
    {
      id: 'problem',
      type: 'list',
      data: {
        text: 'What is happening with {{serialNo|upper}}?',
        button: 'Choose problem',
        sections: [
          {
            id: 'problems',
            title: 'Problems',
            rows: PROBLEMS.map((p) => ({ ...p, set: { problem: p.title } })),
          },
        ],
      },
      next: Object.fromEntries(PROBLEMS.map((p) => [p.id, 'claim'])),
    },
    {
      id: 'claim',
      type: 'ticket',
      data: {
        complete: true,
        set: { claimNo: '$id:CLM' },
        ticket: {
          ticketId: '{{claimNo}}',
          title: 'Warranty claim',
          subtitle: '{{problem}}',
          fields: [
            { label: 'Serial number', value: '{{serialNo|upper}}' },
            { label: 'Customer', value: '{{user.fullName}}' },
            { label: 'Next step', value: 'Video check, then free pickup' },
          ],
          qrData: 'https://lumiohome.example/claim/{{claimNo}}',
        },
        caption: 'Claim {{claimNo}} is open. Most issues are fixed in a 5-minute video check.',
      },
      next: 'engineer',
    },
    {
      id: 'engineer',
      type: 'handoff',
      data: {
        agentName: BRAND.careAgent,
        text: 'Hi {{user.firstName}}, Tara from Lumio Care. I have claim {{claimNo}} open — shall we try a quick reset together, or would you prefer a free pickup?',
      },
      next: 'claim-end',
    },
    { id: 'claim-end', type: 'end', data: { showMenu: false } },
  ],
});
