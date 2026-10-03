/**
 * Application status: application number → acknowledgement with a stage timeline → under
 * verification (notify-me push when approved), documents pending (checklist or token), approved
 * (fee order → pay → digitally signed certificate PDF) or on hold (help desk handoff).
 */
import { defineWorkflow } from '../../author';
import { CIVIC, HELP_DESK } from './data';

const STAGE = 'stage';
const FEE = 'fee';

export const status = defineWorkflow({
  key: 'status',
  name: 'Application status',
  description: 'Track a certificate, licence or connection request',
  keywords: ['status', 'track', 'application status', 'certificate ready', 'where is my'],
  nodes: [
    {
      id: 'ask',
      type: 'input',
      data: {
        prompt:
          'Please type your application number. It is printed on your acknowledgement slip, e.g. SCC-2026-04187.',
        var: 'appNo',
        kind: 'text',
        error: 'Please type the application number, e.g. SCC-2026-04187.',
      },
      next: 'lookup',
    },
    {
      id: 'lookup',
      type: 'delay',
      data: {
        ms: 600,
        note: 'Dummy record, picked per chat.',
        set: {
          appNo: '{{appNo|upper}}',
          stage: '$pick:verification|docs|approved|hold',
          svc: '$pick:Birth certificate|Trade licence|Marriage registration',
          filed: '$days:-6',
          officer: '$pick:Mr. Anil Saxena|Ms. Pooja Tiwari|Mr. Imtiaz Khan',
        },
      },
      next: 'ack',
    },
    {
      id: 'ack',
      type: 'document',
      data: {
        document: {
          fileName: 'Acknowledgement.pdf',
          fileType: 'PDF',
          pages: 1,
          sizeKb: 72,
          preview: {
            title: 'Application acknowledgement',
            subtitle: '{{svc}} · Sundarpur Civic Centre',
            sections: [
              {
                kind: 'fields',
                fields: [
                  { label: 'Application', value: '{{appNo}}' },
                  { label: 'Applicant', value: '{{user.fullName}}' },
                  { label: 'Filed on', value: '{{filed|date}}' },
                  { label: 'Dealing officer', value: '{{officer}}' },
                ],
              },
              {
                kind: 'table',
                heading: 'Progress',
                columns: ['Step', 'Status'],
                rows: [
                  { id: 'filed', cells: ['Application received', 'Done'] },
                  { id: 'scrutiny', cells: ['Document scrutiny', 'Done'] },
                  { id: 'verify', cells: ['Field verification', 'In progress'] },
                  { id: 'approve', cells: ['Approval', 'Pending'] },
                  { id: 'issue', cells: ['Certificate issued', 'Pending'] },
                ],
              },
            ],
            footer: 'Track online at sundarpur-civic.example/track',
          },
        },
        caption: 'Application {{appNo}} for *{{svc}}*, filed on {{filed|date}}.',
      },
      next: STAGE,
    },
    {
      id: STAGE,
      type: 'condition',
      data: {
        cases: [
          { id: 'verification', var: 'stage', op: 'eq', value: 'verification' },
          { id: 'docs', var: 'stage', op: 'eq', value: 'docs' },
          { id: 'approved', var: 'stage', op: 'eq', value: 'approved' },
        ],
      },
      next: { verification: 'st-verify', docs: 'st-docs', approved: 'st-approved', else: 'hold' },
    },
    {
      id: 'st-verify',
      type: 'buttons',
      data: {
        header: 'Under verification',
        text: '{{officer}} is verifying your application. Most are approved within 3 working days.',
        buttons: [
          { id: 'notify', title: 'Notify me' },
          { id: 'menu', title: 'Main menu' },
        ],
      },
      next: { notify: 'notify', menu: 'menu-end' },
    },
    {
      id: 'notify',
      type: 'reminder',
      data: { afterMs: 15_000, label: 'Application approved', note: 'Real use: on approval.' },
      next: { next: 'notify-set', later: 'st-approved' },
    },
    {
      id: 'notify-set',
      type: 'end',
      data: { text: 'Done — we will message you here when it is approved.', showMenu: true },
    },
    {
      id: 'st-docs',
      type: 'buttons',
      data: {
        header: 'Action needed',
        text: 'One document is missing: *address proof* (electricity bill or rent agreement). Submit it at any office within 15 days to keep your application active.',
        buttons: [
          { id: 'token', title: 'Book a token' },
          { id: 'list', title: 'See checklist' },
          { id: 'menu', title: 'Main menu' },
        ],
      },
      next: { token: 'to-token', list: 'to-checklist', menu: 'menu-end' },
    },
    {
      id: 'to-token',
      type: 'jump',
      data: { workflowKey: 'token' },
    },
    {
      id: 'to-checklist',
      type: 'jump',
      data: { workflowKey: 'checklist' },
    },
    {
      id: 'st-approved',
      type: 'text',
      data: {
        text: 'Good news, {{user.firstName}} — your *{{svc}}* application {{appNo}} is approved. Pay the certificate fee to download it right here.',
      },
      next: FEE,
    },
    {
      id: FEE,
      type: 'order',
      data: {
        set: { challan: '$id:CHL' },
        order: {
          orderId: '{{challan}}',
          title: 'Certificate fee',
          items: [{ id: 'cert', name: '{{svc}} — certified copy', qty: 1, price: 50 }],
          adjustments: [{ id: 'service', label: 'Online service charge', amount: 20 }],
          status: 'pending',
          payTitle: 'Pay now',
        },
      },
      next: { pay: 'paid' },
    },
    {
      id: 'paid',
      type: 'order',
      data: {
        order: {
          orderId: '{{challan}}',
          title: 'Payment received',
          items: [{ id: 'cert', name: '{{svc}} — certified copy', qty: 1, price: 50 }],
          adjustments: [{ id: 'service', label: 'Online service charge', amount: 20 }],
          status: 'paid',
        },
      },
      next: 'certificate',
    },
    {
      id: 'certificate',
      type: 'document',
      data: {
        complete: true,
        set: { certNo: '$id:CERT' },
        document: {
          fileName: 'Certificate.pdf',
          fileType: 'PDF',
          pages: 1,
          sizeKb: 148,
          preview: {
            title: '{{svc}}',
            subtitle: 'Issued by Sundarpur Civic Centre (digitally signed)',
            sections: [
              {
                kind: 'fields',
                fields: [
                  { label: 'Certificate no.', value: '{{certNo}}' },
                  { label: 'Application', value: '{{appNo}}' },
                  { label: 'Issued to', value: '{{user.fullName}}' },
                  { label: 'Fee receipt', value: '{{challan}}' },
                  { label: 'Signed by', value: '{{officer}}, Registrar' },
                ],
              },
              {
                kind: 'text',
                heading: 'Verification',
                text: 'This digitally signed copy is valid everywhere a printed copy is. Anyone can verify it by scanning the QR or at sundarpur-civic.example/verify.',
              },
            ],
            footer: 'Sample document for demonstration — not a real certificate',
          },
        },
        caption: 'Your certificate is ready. Keep it safe — you can download it again any time.',
      },
      next: 'cert-end',
    },
    {
      id: 'cert-end',
      type: 'end',
      data: { text: 'Thank you for using Sundarpur Civic Centre online.', showMenu: true },
    },
    {
      id: 'hold',
      type: 'handoff',
      data: {
        complete: true,
        agentName: HELP_DESK.agentName,
        text: "Namaste {{user.firstName}}, I'm Rekha from the help desk. Application {{appNo}} is on hold because the ward record needs a correction. I can explain what is needed — or call me directly.",
      },
      next: 'hold-card',
    },
    {
      id: 'hold-card',
      type: 'contact',
      data: {
        contact: {
          name: HELP_DESK.name,
          phone: HELP_DESK.phone,
          role: HELP_DESK.role,
          organisation: 'Sundarpur Civic Centre',
        },
      },
      next: 'hold-cta',
    },
    {
      id: 'hold-cta',
      type: 'cta',
      data: {
        text: 'You can also track every update online.',
        actions: [
          { kind: 'call', title: 'Call help desk', phone: HELP_DESK.phone },
          { kind: 'url', title: 'Track online', url: CIVIC.track },
        ],
      },
      next: 'menu-end',
    },
    {
      id: 'menu-end',
      type: 'end',
      data: { showMenu: true },
    },
  ],
});
