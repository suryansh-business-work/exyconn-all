/**
 * Document checklist: purpose → its checklist PDF → upload through the secure portal (a push
 * confirms verification), a doorstep pickup (address, day, slot, QR slip), or done.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import { CHECKLISTS, FIRM, type Checklist } from './data';

const SEND = 'send';
/** Six purposes, at most six condition cases: the last purpose is the `else`. */
const ROUTED = CHECKLISTS.slice(0, -1);
const DEFAULT_LIST = CHECKLISTS[CHECKLISTS.length - 1];

function checklistDoc(list: Checklist): AuthorNode {
  return {
    id: `doc-${list.id}`,
    type: 'document',
    data: {
      document: {
        fileName: 'Kosh_Document_Checklist.pdf',
        fileType: 'PDF',
        pages: 1,
        sizeKb: 58,
        preview: {
          title: 'Document checklist',
          subtitle: list.title,
          sections: [
            {
              kind: 'table',
              heading: 'Keep these ready',
              columns: ['#', 'Document'],
              rows: list.documents.map((doc, i) => ({
                id: `d${i + 1}`,
                cells: [String(i + 1), doc],
              })),
            },
            {
              kind: 'text',
              heading: 'Tips',
              text: 'Self-attest every copy. Bank statements must be the PDF from your bank, not screenshots. Passwords on PDFs can be shared separately with your relationship manager.',
            },
          ],
          footer: 'Kosh Finserv · checklists may vary slightly by lender',
        },
      },
      caption: 'Your checklist for *{{purpose}}*.',
    },
    next: SEND,
  };
}

export const documentChecklist = defineWorkflow({
  key: 'document-checklist',
  name: 'Document checklist',
  description: 'What to keep ready, and send it securely',
  keywords: ['documents', 'checklist', 'kyc', 'upload', 'papers', 'claim documents'],
  nodes: [
    {
      id: 'purpose',
      type: 'list',
      data: {
        text: 'Hi {{user.firstName}}, what do you need documents for?',
        button: 'Choose purpose',
        sections: [
          {
            id: 'purposes',
            title: 'Checklists',
            rows: CHECKLISTS.map((c) => ({
              id: c.id,
              title: c.title,
              description: c.description,
              set: { purpose: c.title, purposeKey: c.id },
            })),
          },
        ],
      },
      next: Object.fromEntries(CHECKLISTS.map((c) => [c.id, 'route'])),
    },
    {
      id: 'route',
      type: 'condition',
      data: {
        cases: ROUTED.map((c) => ({ id: c.id, var: 'purposeKey', op: 'eq' as const, value: c.id })),
      },
      next: {
        ...Object.fromEntries(ROUTED.map((c) => [c.id, `doc-${c.id}`])),
        else: `doc-${DEFAULT_LIST.id}`,
      },
    },
    ...CHECKLISTS.map(checklistDoc),
    {
      id: SEND,
      type: 'buttons',
      data: {
        text: 'Ready to send them? Choose what is easiest.',
        footer: 'Encrypted · deleted after verification',
        buttons: [
          { id: 'upload', title: 'Upload securely' },
          { id: 'pickup', title: 'Doorstep pickup' },
          { id: 'later', title: 'Later' },
        ],
      },
      next: { upload: 'upload', pickup: 'pincode', later: 'later' },
    },
    {
      id: 'upload',
      type: 'cta',
      data: {
        text: 'Upload through our secure portal — the link is personal to you and expires in 24 hours. PDF, JPG or PNG up to 10 MB each.',
        actions: [{ kind: 'url', title: 'Open secure upload', url: FIRM.upload }],
      },
      next: 'verify-wait',
    },
    {
      id: 'verify-wait',
      type: 'reminder',
      data: {
        afterMs: 15_000,
        label: 'Documents verified',
        note: 'Real use: when the operations team signs off.',
      },
      next: { next: 'upload-end', later: 'verified' },
    },
    {
      id: 'upload-end',
      type: 'end',
      data: { text: 'We will confirm here once our team has checked them.', showMenu: true },
    },
    {
      id: 'verified',
      type: 'buttons',
      data: {
        set: { verifyId: '$id:VR' },
        header: 'Documents verified',
        text: 'All set, {{user.firstName}} — your *{{purpose}}* documents are verified (reference {{verifyId}}). Nothing else is needed for now.',
        buttons: [
          { id: 'ok', title: 'Thanks' },
          { id: 'advisor', title: 'Book an advisor' },
        ],
      },
      next: { ok: 'done', advisor: 'to-advisor' },
    },
    { id: 'to-advisor', type: 'jump', data: { workflowKey: 'advisor-appointment' } },
    {
      id: 'done',
      type: 'end',
      data: { complete: true, text: 'Thank you for banking on Kosh Finserv.', showMenu: true },
    },
    {
      id: 'pincode',
      type: 'input',
      data: { prompt: 'Your 6-digit PIN code for the pickup?', var: 'pincode', kind: 'pincode' },
      next: 'address',
    },
    {
      id: 'address',
      type: 'input',
      data: {
        prompt: 'And the pickup address with a landmark?',
        var: 'address',
        kind: 'text',
        error: 'Please type a little more of the address so our executive can find you.',
      },
      next: 'day',
    },
    {
      id: 'day',
      type: 'list',
      data: {
        text: 'Which day should our executive come?',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 6, skipSundays: true, var: 'day' },
      },
      next: { pick: 'slot' },
    },
    {
      id: 'slot',
      type: 'list',
      data: {
        text: 'Pickup windows on {{dayLabel}}:',
        button: 'Choose window',
        sections: [
          {
            id: 'more',
            title: 'More options',
            rows: [{ id: 'other-day', title: 'Pick another day' }],
          },
        ],
        dynamic: {
          kind: 'slots',
          dayVar: 'day',
          from: 9,
          to: 19,
          stepMin: 120,
          take: 5,
          var: 'slot',
        },
      },
      next: { pick: 'slip', 'other-day': 'day' },
    },
    {
      id: 'slip',
      type: 'ticket',
      data: {
        set: { pickupId: '$id:DP', execName: '$pick:Kunal Patel|Nisha Rana|Imran Pathan' },
        complete: true,
        ticket: {
          ticketId: '{{pickupId}}',
          title: 'Document pickup booked',
          subtitle: '{{purpose}}',
          fields: [
            { label: 'Customer', value: '{{user.fullName}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'From', value: '{{slot|time}}' },
            { label: 'Address', value: '{{address}}, {{pincode}}' },
            { label: 'Executive', value: '{{execName}}' },
          ],
          qrData: 'kosh://pickup/{{pickupId}}?slot={{slot}}',
        },
        caption:
          'Our executive carries a Kosh ID card and scans this QR. Hand over copies only — never originals or cheque books.',
      },
      next: 'pickup-end',
    },
    {
      id: 'pickup-end',
      type: 'end',
      data: {
        text: 'Booked. We will message you when {{execName}} is on the way.',
        showMenu: true,
      },
    },
    {
      id: 'later',
      type: 'end',
      data: { text: 'No problem. Your checklist stays in this chat.', showMenu: true },
    },
  ],
});
