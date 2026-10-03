/**
 * Document collection: the matter → checklist PDF with pending items flagged → pick a pending
 * document → upload through the secure vault (a push confirms receipt), a sealed courier
 * pickup (address, day, slot, QR slip), or a drop at the office → send another or finish.
 */
import { defineWorkflow } from '../../author';
import { CASE_DOCUMENTS, FIRM, SAMPLE_CASE } from './data';

const CHECKLIST = 'checklist';
const PENDING = 'pending';
const MORE = 'more';
const PENDING_DOCS = CASE_DOCUMENTS.filter((d) => d.status === 'Pending');

export const documentCollection = defineWorkflow({
  key: 'document-collection',
  name: 'Send documents',
  description: 'Share case documents securely, by courier or at the office',
  keywords: ['documents', 'send documents', 'upload', 'papers', 'courier', 'checklist'],
  nodes: [
    {
      id: 'which',
      type: 'buttons',
      data: {
        text: 'Hi {{user.firstName}}, which matter are these documents for?',
        buttons: [
          { id: 'open', title: 'My open matter', set: { caseRef: '$id:LX' } },
          { id: 'type', title: 'Type a reference' },
        ],
      },
      next: { open: CHECKLIST, type: 'ref' },
    },
    {
      id: 'ref',
      type: 'input',
      data: {
        prompt: 'Please type the matter reference from our engagement letter, e.g. LX-7KQ2M9.',
        var: 'caseRef',
        kind: 'text',
      },
      next: CHECKLIST,
    },
    {
      id: CHECKLIST,
      type: 'document',
      data: {
        set: { caseTitle: SAMPLE_CASE.title, advocate: SAMPLE_CASE.advocate },
        document: {
          fileName: 'Lexora_Document_Status.pdf',
          fileType: 'PDF',
          pages: 1,
          sizeKb: 72,
          preview: {
            title: 'Document status',
            subtitle: '{{caseTitle}}',
            sections: [
              {
                kind: 'fields',
                fields: [
                  { label: 'Client', value: '{{user.fullName}}' },
                  { label: 'Matter', value: '{{caseRef|upper}}' },
                  { label: 'Advocate', value: '{{advocate}}' },
                ],
              },
              {
                kind: 'table',
                heading: 'Documents',
                columns: ['Document', 'Status'],
                rows: CASE_DOCUMENTS.map((d) => ({
                  id: d.id,
                  cells: [d.name, d.status],
                  flag: d.status === 'Pending' ? ('high' as const) : undefined,
                })),
              },
            ],
            footer: 'Pending items are needed before the next hearing.',
          },
        },
        caption:
          '{{advocate}} still needs a few documents for {{caseRef|upper}}. Pending ones are highlighted.',
      },
      next: PENDING,
    },
    {
      id: PENDING,
      type: 'list',
      data: {
        text: 'Which document would you like to send now?',
        button: 'Pending documents',
        sections: [
          {
            id: 'pending',
            title: 'Pending',
            rows: PENDING_DOCS.map((d) => ({ id: d.id, title: d.name, set: { docName: d.name } })),
          },
        ],
      },
      next: Object.fromEntries(PENDING_DOCS.map((d) => [d.id, 'how'])),
    },
    {
      id: 'how',
      type: 'buttons',
      data: {
        text: 'How would you like to send the *{{docName}}*?',
        footer: 'Never email originals — copies are fine',
        buttons: [
          { id: 'upload', title: 'Upload securely' },
          { id: 'courier', title: 'Courier pickup' },
          { id: 'office', title: 'Drop at office' },
        ],
      },
      next: { upload: 'upload', courier: 'pincode', office: 'office-pin' },
    },
    {
      id: 'upload',
      type: 'cta',
      data: {
        text: 'Upload the {{docName}} through our encrypted client vault. The link is personal to you and expires in 24 hours. PDF or clear photos, up to 25 MB.',
        actions: [{ kind: 'url', title: 'Open secure vault', url: FIRM.upload }],
      },
      next: 'upload-wait',
    },
    {
      id: 'upload-wait',
      type: 'reminder',
      data: {
        afterMs: 15_000,
        label: 'Document received',
        note: 'Real use: when the vault receives the file.',
      },
      next: { next: 'upload-end', later: 'received' },
    },
    {
      id: 'upload-end',
      type: 'end',
      data: { text: 'We will confirm here as soon as the file arrives.', showMenu: true },
    },
    {
      id: 'received',
      type: 'text',
      data: {
        set: { receiptId: '$id:RCV' },
        text: 'Received: *{{docName}}* for {{caseRef|upper}} (receipt {{receiptId}}). {{advocate}}’s team will review it within one working day.',
      },
      next: MORE,
    },
    {
      id: 'pincode',
      type: 'input',
      data: {
        prompt: 'Your 6-digit PIN code for the courier pickup?',
        var: 'pincode',
        kind: 'pincode',
      },
      next: 'address',
    },
    {
      id: 'address',
      type: 'input',
      data: {
        prompt: 'And the pickup address with a landmark?',
        var: 'address',
        kind: 'text',
        error: 'Please type a little more of the address so the courier can find you.',
      },
      next: 'day',
    },
    {
      id: 'day',
      type: 'list',
      data: {
        text: 'Which day should the courier come?',
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
        text: 'Two-hour pickup windows on {{dayLabel}}:',
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
          from: 10,
          to: 18,
          stepMin: 120,
          take: 4,
          var: 'slot',
        },
      },
      next: { pick: 'slip', 'other-day': 'day' },
    },
    {
      id: 'slip',
      type: 'ticket',
      data: {
        set: { pickupId: '$id:CR', seal: '$int:100000:999999' },
        ticket: {
          ticketId: '{{pickupId}}',
          title: 'Courier pickup booked',
          subtitle: 'Sealed envelope · free for clients',
          fields: [
            { label: 'Matter', value: '{{caseRef|upper}}' },
            { label: 'Document', value: '{{docName}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'From', value: '{{slot|time}}' },
            { label: 'Address', value: '{{address}}, {{pincode}}' },
            { label: 'Seal no.', value: '{{seal}}' },
          ],
          qrData: 'lexora://courier/{{pickupId}}?seal={{seal}}',
        },
        caption:
          'Hand the envelope over only after the courier scans this QR and the seal number matches.',
      },
      next: MORE,
    },
    {
      id: 'office-pin',
      type: 'location',
      data: {
        location: { name: FIRM.name, address: FIRM.address, lat: FIRM.lat, lng: FIRM.lng },
        caption:
          'Front desk, 5th floor — Mon to Sat, 10 am to 6 pm. Ask for a stamped acknowledgement.',
      },
      next: 'office-ack',
    },
    {
      id: 'office-ack',
      type: 'ticket',
      data: {
        set: { dropId: '$id:DR' },
        ticket: {
          ticketId: '{{dropId}}',
          title: 'Drop-off pass',
          subtitle: 'Lexora front desk, Saket',
          fields: [
            { label: 'Matter', value: '{{caseRef|upper}}' },
            { label: 'Document', value: '{{docName}}' },
            { label: 'Client', value: '{{user.fullName}}' },
          ],
          qrData: 'lexora://dropoff/{{dropId}}',
        },
        caption: 'Show this at the front desk — no waiting.',
      },
      next: MORE,
    },
    {
      id: MORE,
      type: 'buttons',
      data: {
        text: 'Anything else to send for {{caseRef|upper}}?',
        buttons: [
          { id: 'another', title: 'Send another' },
          { id: 'done', title: 'All done' },
        ],
      },
      next: { another: PENDING, done: 'done' },
    },
    {
      id: 'done',
      type: 'end',
      data: {
        complete: true,
        text: 'Thank you, {{user.firstName}}. {{advocate}} will let you know if anything else is needed.',
        showMenu: true,
      },
    },
  ],
});
