/**
 * Application status: the candidate's application (from this chat or typed in) → its stage
 * → under review (with a "notify me" push that leads to interview booking), interview due
 * (jump to scheduling), offer stage (jump to documents) or on hold (handoff to the recruiter).
 */
import { defineWorkflow } from '../../author';
import { RECRUITER } from './data';

const STAGE = 'stage';

export const status = defineWorkflow({
  key: 'status',
  name: 'Application status',
  description: 'Where your application stands, and what is next',
  keywords: ['status', 'application status', 'update', 'result', 'selected'],
  nodes: [
    {
      id: 'has-app',
      type: 'condition',
      data: { cases: [{ id: 'known', var: 'appId', op: 'notEmpty' }] },
      next: { known: 'which', else: 'ask' },
    },
    {
      id: 'which',
      type: 'buttons',
      data: {
        text: 'Check application *{{appId}}* for {{job}}, or another one?',
        buttons: [
          { id: 'this', title: 'This one', set: { stage: 'interview' } },
          { id: 'other', title: 'Another one' },
        ],
      },
      next: { this: 'lookup', other: 'ask' },
    },
    {
      id: 'ask',
      type: 'input',
      data: {
        prompt:
          'Please type your application number — it is in the message we sent when you applied, e.g. APP-7KQ2MD.',
        var: 'appRef',
        kind: 'text',
        error: 'Please type the application number, e.g. APP-7KQ2MD.',
      },
      next: 'lookup-new',
    },
    {
      id: 'lookup-new',
      type: 'delay',
      data: {
        ms: 500,
        note: 'A typed number gets a role of its own.',
        set: {
          appId: '{{appRef|upper}}',
          stage: '$pick:review|interview|offer|hold',
          job: '$pick:Senior Backend Engineer|Inside Sales Associate|UX Designer|Accounts Manager',
          client: '$pick:Fintrail Payments|Cartwheel Retail|Agrolink Foods|Voltgrid Energy',
        },
      },
      next: 'lookup',
    },
    {
      id: 'lookup',
      type: 'notice',
      data: {
        set: { updated: '$days:-2' },
        text: 'Application {{appId}} · last updated {{updated|day}}',
      },
      next: STAGE,
    },
    {
      id: STAGE,
      type: 'condition',
      data: {
        note: 'A shortlisted application from this chat is at interviews; a typed one gets a dummy stage.',
        cases: [
          { id: 'review', var: 'stage', op: 'eq', value: 'review' },
          { id: 'interview', var: 'stage', op: 'eq', value: 'interview' },
          { id: 'offer', var: 'stage', op: 'eq', value: 'offer' },
        ],
      },
      next: { review: 'st-review', interview: 'st-interview', offer: 'st-offer', else: 'st-hold' },
    },
    {
      id: 'st-review',
      type: 'buttons',
      data: {
        header: 'Stage: profile review',
        text: '{{client}} is reviewing your profile for *{{job}}*. Most teams respond within 3 working days.',
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
      data: { afterMs: 15_000, label: 'Application update', note: 'Real use: on a stage change.' },
      next: { next: 'notify-set', later: 'shortlisted' },
    },
    {
      id: 'notify-set',
      type: 'end',
      data: { text: 'Done — you will hear from us here the moment it moves.', showMenu: true },
    },
    {
      id: 'shortlisted',
      type: 'buttons',
      data: {
        header: 'Application update',
        complete: true,
        text: 'Good news, {{user.firstName}}! {{client}} has shortlisted you for *{{job}}*. Shall we book your interview?',
        buttons: [
          { id: 'book', title: 'Book interview' },
          { id: 'later', title: 'Later' },
        ],
      },
      next: { book: 'to-interview', later: 'menu-end' },
    },
    {
      id: 'st-interview',
      type: 'buttons',
      data: {
        header: 'Stage: interviews',
        complete: true,
        text: 'You cleared the recruiter screen for *{{job}}*. The next step is the skills interview with {{client}}.',
        buttons: [
          { id: 'book', title: 'Book interview' },
          { id: 'later', title: 'Later' },
        ],
      },
      next: { book: 'to-interview', later: 'menu-end' },
    },
    {
      id: 'to-interview',
      type: 'jump',
      data: { workflowKey: 'interview' },
    },
    {
      id: 'st-offer',
      type: 'buttons',
      data: {
        header: 'Stage: offer',
        complete: true,
        text: '{{client}} wants to make you an offer for *{{job}}*. We just need a few documents first.',
        buttons: [
          { id: 'docs', title: 'Send documents' },
          { id: 'later', title: 'Later' },
        ],
      },
      next: { docs: 'to-documents', later: 'menu-end' },
    },
    {
      id: 'to-documents',
      type: 'jump',
      data: { workflowKey: 'documents' },
    },
    {
      id: 'st-hold',
      type: 'handoff',
      data: {
        complete: true,
        agentName: RECRUITER.agentName,
        text: "Hi {{user.firstName}}, I'm Shruti. {{client}} has paused hiring for {{job}} for a couple of weeks. I'd love to put you forward for two similar roles — can I share them?",
      },
      next: 'hold-card',
    },
    {
      id: 'hold-card',
      type: 'contact',
      data: {
        contact: {
          name: RECRUITER.name,
          phone: RECRUITER.phone,
          role: RECRUITER.role,
          organisation: 'Kaveri Talent Partners',
        },
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
