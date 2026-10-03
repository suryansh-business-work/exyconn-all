/**
 * Document submission: checklist PDF → submit documents one at a time (looping list) →
 * joining date and PIN code → submission receipt → a verification push that delivers the
 * offer letter → accept (joining pass + office pin), discuss with HR, or decline with a reason.
 */
import { defineWorkflow } from '../../author';
import { AGENCY, DOCUMENTS, HR_PARTNER } from './data';

const PICK = 'pick';

export const documents = defineWorkflow({
  key: 'documents',
  name: 'Submit documents',
  description: 'Send your documents and receive your offer letter',
  keywords: ['documents', 'upload', 'offer', 'offer letter', 'certificates', 'payslip'],
  nodes: [
    {
      id: 'has-role',
      type: 'condition',
      data: {
        note: 'Reuse the role from this chat; otherwise a selected candidate.',
        cases: [{ id: 'none', var: 'appId', op: 'empty' }],
      },
      next: { none: 'seed-role', else: 'intro' },
    },
    {
      id: 'seed-role',
      type: 'delay',
      data: {
        ms: 300,
        set: {
          appId: '$id:APP',
          job: '$pick:Frontend Developer|Data Analyst|Customer Support Lead',
          client: '$pick:Medisphere Labs|Cartwheel Retail',
        },
      },
      next: 'intro',
    },
    {
      id: 'intro',
      type: 'text',
      data: {
        text: 'Congratulations, {{user.firstName}}! {{client}} has selected you for *{{job}}*. Before we release the offer, please send the documents below — it takes about 5 minutes.',
      },
      next: 'checklist',
    },
    {
      id: 'checklist',
      type: 'document',
      data: {
        document: {
          fileName: 'Document_Checklist.pdf',
          fileType: 'PDF',
          pages: 1,
          sizeKb: 96,
          preview: {
            title: 'Pre-offer document checklist',
            subtitle: '{{job}} · {{client}} · application {{appId}}',
            sections: [
              {
                kind: 'table',
                heading: 'Please send',
                columns: ['Document', 'Accepted formats'],
                rows: DOCUMENTS.map((d) => ({ id: d.id, cells: [d.title, d.description] })),
              },
              {
                kind: 'text',
                heading: 'Privacy',
                text: 'Mask the first 8 digits of your Aadhaar. Documents are used only for background verification and are deleted 90 days after joining.',
              },
            ],
            footer: 'Kaveri Talent Partners · kaveritalent.example/privacy',
          },
        },
        caption: 'Your checklist. Send each document from the list below.',
      },
      next: PICK,
    },
    {
      id: PICK,
      type: 'list',
      data: {
        text: 'Which document are you sending?',
        footer: 'PDF, JPG or Word · up to 5 MB each',
        button: 'Choose document',
        sections: [
          {
            id: 'docs',
            title: 'Documents',
            rows: DOCUMENTS.map((d) => ({
              id: d.id,
              title: d.title,
              description: d.description,
              set: { doc: d.title, docFile: d.file },
            })),
          },
          {
            id: 'finish',
            title: 'Finished?',
            rows: [{ id: 'done', title: 'I have sent everything' }],
          },
        ],
      },
      next: { ...Object.fromEntries(DOCUMENTS.map((d) => [d.id, 'received'])), done: 'join-date' },
    },
    {
      id: 'received',
      type: 'notice',
      data: { text: '{{docFile}} uploaded' },
      next: 'ack',
    },
    {
      id: 'ack',
      type: 'buttons',
      data: {
        text: '*{{doc}}* received and sent for verification.',
        buttons: [
          { id: 'more', title: 'Send another' },
          { id: 'done', title: 'All done' },
        ],
      },
      next: { more: PICK, done: 'join-date' },
    },
    {
      id: 'join-date',
      type: 'input',
      data: {
        prompt: 'Thanks! From which date can you join? (DD/MM/YYYY)',
        var: 'joinDate',
        kind: 'date',
        error: 'Please type the date as DD/MM/YYYY, e.g. 02/11/2026.',
      },
      next: 'pin',
    },
    {
      id: 'pin',
      type: 'input',
      data: {
        prompt: 'And the PIN code of your current address, for background verification.',
        var: 'pincode',
        kind: 'pincode',
      },
      next: 'receipt',
    },
    {
      id: 'receipt',
      type: 'ticket',
      data: {
        set: { submissionId: '$id:DOC' },
        ticket: {
          ticketId: '{{submissionId}}',
          title: 'Documents submitted',
          subtitle: '{{job}} · {{client}}',
          fields: [
            { label: 'Candidate', value: '{{user.fullName}}' },
            { label: 'Application', value: '{{appId}}' },
            { label: 'Joining from', value: '{{joinDate}}' },
            { label: 'Address PIN', value: '{{pincode}}' },
            { label: 'Verification', value: '1–2 working days' },
          ],
          qrData: 'https://kaveritalent.example/d/{{submissionId}}',
        },
        caption: 'We will message you here as soon as verification is complete.',
      },
      next: 'verify',
    },
    {
      id: 'verify',
      type: 'reminder',
      data: {
        afterMs: 15_000,
        label: 'Your offer letter is ready',
        note: 'Real use: when background verification clears.',
      },
      next: { next: 'waiting', later: 'offer' },
    },
    {
      id: 'waiting',
      type: 'end',
      data: {
        text: 'Thank you, {{user.firstName}}. Your offer letter will arrive in this chat.',
        showMenu: true,
      },
    },
    {
      id: 'offer',
      type: 'document',
      data: {
        complete: true,
        set: { offerId: '$id:OFR' },
        document: {
          fileName: 'Offer_Letter.pdf',
          fileType: 'PDF',
          pages: 4,
          sizeKb: 312,
          preview: {
            title: 'Letter of offer',
            subtitle: '{{job}} · {{client}}',
            sections: [
              {
                kind: 'fields',
                heading: 'Offer',
                fields: [
                  { label: 'Candidate', value: '{{user.fullName}}' },
                  { label: 'Reference', value: '{{offerId}}' },
                  { label: 'Joining date', value: '{{joinDate}}' },
                  { label: 'Probation', value: '6 months' },
                ],
              },
              {
                kind: 'table',
                heading: 'Compensation (yearly)',
                columns: ['Component', 'Amount'],
                rows: [
                  { id: 'basic', cells: ['Basic salary', '₹5,76,000'] },
                  { id: 'hra', cells: ['House rent allowance', '₹2,88,000'] },
                  { id: 'special', cells: ['Special allowance', '₹3,12,000'] },
                  { id: 'pf', cells: ["Employer's PF", '₹69,120'] },
                  { id: 'variable', cells: ['Performance bonus (target)', '₹1,44,000'] },
                  { id: 'total', cells: ['Total CTC', '₹13,89,120'] },
                ],
              },
              {
                kind: 'text',
                heading: 'Benefits',
                text: 'Family health insurance of ₹5 lakh, 24 days of paid leave, a ₹25,000 yearly learning budget and a laptop. This offer is valid for 7 days.',
              },
            ],
            footer: 'Issued by {{client}} through Kaveri Talent Partners',
          },
        },
        caption:
          'Verification is complete. Here is your offer letter, {{user.firstName}} — congratulations!',
      },
      next: 'offer-next',
    },
    {
      id: 'offer-next',
      type: 'buttons',
      data: {
        text: 'Would you like to accept the offer?',
        footer: 'Valid for 7 days',
        buttons: [
          { id: 'accept', title: 'Accept offer' },
          { id: 'discuss', title: 'Discuss with HR' },
          { id: 'decline', title: 'Decline' },
        ],
      },
      next: { accept: 'accepted', discuss: 'hr', decline: 'decline-why' },
    },
    {
      id: 'accepted',
      type: 'ticket',
      data: {
        ticket: {
          ticketId: '{{offerId}}',
          title: 'Offer accepted',
          subtitle: 'Welcome to {{client}}!',
          fields: [
            { label: 'Name', value: '{{user.fullName}}' },
            { label: 'Role', value: '{{job}}' },
            { label: 'Joining', value: '{{joinDate}}, 9:30 am' },
            { label: 'Report to', value: 'HR desk, ground floor' },
          ],
          qrData: 'https://kaveritalent.example/join/{{offerId}}',
        },
        caption: 'Show this QR at the HR desk on day one. Your welcome kit will be ready.',
      },
      next: 'day-one',
    },
    {
      id: 'day-one',
      type: 'location',
      data: {
        location: {
          name: 'Onboarding centre',
          address: AGENCY.address,
          lat: AGENCY.lat,
          lng: AGENCY.lng,
        },
        caption: 'Day-one induction happens here. Bring originals of the documents you sent.',
      },
      next: 'accepted-end',
    },
    {
      id: 'accepted-end',
      type: 'end',
      data: { text: 'See you on {{joinDate}}, {{user.firstName}}!', showMenu: true },
    },
    {
      id: 'hr',
      type: 'handoff',
      data: {
        agentName: HR_PARTNER.agentName,
        text: "Hi {{user.firstName}}, I'm Farhan from HR onboarding. I have offer {{offerId}} open — what would you like to talk about: the pay, the joining date or the role?",
      },
      next: 'hr-card',
    },
    {
      id: 'hr-card',
      type: 'contact',
      data: {
        contact: {
          name: HR_PARTNER.name,
          phone: HR_PARTNER.phone,
          role: HR_PARTNER.role,
          organisation: 'Kaveri Talent Partners',
        },
      },
      next: 'hr-end',
    },
    {
      id: 'hr-end',
      type: 'end',
      data: { showMenu: true },
    },
    {
      id: 'decline-why',
      type: 'input',
      data: {
        prompt: 'Sorry to hear that. Could you tell us why? It helps us find you a better fit.',
        var: 'declineReason',
        kind: 'text',
      },
      next: 'declined',
    },
    {
      id: 'declined',
      type: 'end',
      data: {
        text: 'Thank you for telling us, {{user.firstName}}. Your profile stays active and we will share better-matched roles.',
        showMenu: true,
      },
    },
  ],
});
