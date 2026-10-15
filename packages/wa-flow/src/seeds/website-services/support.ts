/**
 * Client support: project code → issue type → priority → description → a support ticket with
 * the SLA. Critical issues page the on-call engineer straight away; the rest get a status
 * update push later.
 */
import { defineWorkflow } from '../../author';
import { AGENCY } from './data';
import { ISSUE_TYPES, PRIORITIES } from './options';

export const support = defineWorkflow({
  key: 'support',
  name: 'Client support',
  description: 'Raise a ticket on your project, with SLAs',
  keywords: ['support', 'bug', 'issue', 'ticket', 'site down', 'not working', 'help desk'],
  nodes: [
    {
      id: 'project',
      type: 'input',
      data: {
        prompt:
          'Hi {{user.firstName}}, sorry something needs attention. What is your project code? It starts with NS, like NS-2041, and is on every invoice.',
        var: 'projectCode',
        kind: 'text',
      },
      next: 'issue',
    },
    {
      id: 'issue',
      type: 'list',
      data: {
        text: 'Thanks. What kind of issue is it on {{projectCode|upper}}?',
        button: 'Issue type',
        sections: [
          {
            id: 'issues',
            title: 'Issue types',
            rows: ISSUE_TYPES.map((i) => ({ ...i, set: { issueType: i.title } })),
          },
        ],
      },
      next: Object.fromEntries(ISSUE_TYPES.map((i) => [i.id, 'priority'])),
    },
    {
      id: 'priority',
      type: 'buttons',
      data: {
        text: 'How urgent is it? Critical means users cannot work or pay.',
        buttons: PRIORITIES.map((p) => ({
          id: p.id,
          title: p.title,
          set: { priority: p.id, priorityLabel: p.label, sla: p.sla },
        })),
      },
      next: Object.fromEntries(PRIORITIES.map((p) => [p.id, 'describe'])),
    },
    {
      id: 'describe',
      type: 'input',
      data: {
        prompt:
          'Describe what is happening — the page or screen, what you expected, and when it started.',
        var: 'issueDetails',
        kind: 'text',
        error: 'A little more detail helps us fix it faster. Please add a sentence or two.',
      },
      next: 'ticket',
    },
    {
      id: 'ticket',
      type: 'ticket',
      data: {
        complete: true,
        set: { ticketNo: '$id:SUP' },
        ticket: {
          ticketId: '{{ticketNo}}',
          title: 'Support ticket',
          subtitle: '{{issueType}}',
          fields: [
            { label: 'Project', value: '{{projectCode|upper}}' },
            { label: 'Priority', value: '{{priorityLabel}}' },
            { label: 'First response', value: 'within {{sla}}' },
            { label: 'Raised by', value: '{{user.fullName}}' },
            { label: 'Details', value: '{{issueDetails}}' },
          ],
          qrData: 'https://support.northstar.example/t/{{ticketNo}}',
        },
        caption: 'Ticket {{ticketNo}} is logged. You will get updates here and at {{user.email}}.',
      },
      next: 'critical',
    },
    {
      id: 'critical',
      type: 'condition',
      data: { cases: [{ id: 'p1', var: 'priority', op: 'eq', value: 'p1' }] },
      next: { p1: 'on-call', else: 'status' },
    },
    {
      id: 'on-call',
      type: 'handoff',
      data: {
        agentName: AGENCY.supportAgent,
        text: 'Hi {{user.firstName}}, Meera from the on-call team. I have ticket {{ticketNo}} open and I am checking {{projectCode|upper}} now. Can you share a screenshot or the exact error?',
      },
      next: 'hotline',
    },
    {
      id: 'hotline',
      type: 'cta',
      data: {
        text: 'If the outage is spreading, call the 24×7 line and quote {{ticketNo}}.',
        actions: [
          { kind: 'call', title: 'Call on-call line', phone: AGENCY.supportPhone },
          { kind: 'url', title: 'System status', url: AGENCY.status },
        ],
      },
      next: 'p1-end',
    },
    { id: 'p1-end', type: 'end', data: { showMenu: false } },
    {
      id: 'status',
      type: 'reminder',
      data: {
        afterMs: 25_000,
        label: 'Ticket update',
        note: 'Real use: when an engineer picks it up.',
      },
      next: { next: 'logged-end', later: 'update' },
    },
    {
      id: 'logged-end',
      type: 'end',
      data: { text: 'We will update you within {{sla}}. Anything else?', showMenu: true },
    },
    {
      id: 'update',
      type: 'buttons',
      data: {
        header: 'Ticket update',
        set: { engineer: '$pick:Dev Patel|Sana Iqbal|Arjun Nair' },
        text: '{{engineer}} has picked up {{ticketNo}} and reproduced the issue. A fix is planned for today; we will confirm once it is live.',
        buttons: [
          { id: 'thanks', title: 'Thanks' },
          { id: 'call', title: 'Request a call' },
        ],
      },
      next: { thanks: 'update-end', call: 'call-back' },
    },
    { id: 'update-end', type: 'end', data: { text: 'You are welcome!', showMenu: true } },
    {
      id: 'call-back',
      type: 'end',
      data: {
        text: '{{engineer}} will call you within the hour about {{ticketNo}}.',
        showMenu: true,
      },
    },
  ],
});
