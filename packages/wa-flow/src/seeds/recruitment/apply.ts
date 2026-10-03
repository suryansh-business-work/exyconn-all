/**
 * Apply and screening: function → role → job description PDF → four screening questions
 * (experience as a number, notice period, expected CTC read by an `ai` node with a band list
 * as fallback, location) → experience and location gates → shortlisted ticket and a jump to
 * interview booking, or a polite "not this one" with a job-alert push.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import {
  AGENCY,
  ALL_FUNCTIONS,
  CTC_BANDS,
  FUNCTIONS,
  OPERATIONS,
  RECRUITER,
  type Job,
  type JobFunction,
} from './data';

const FUNCTION = 'function';
const SHORTLIST = 'shortlisted';
const NOT_YET = 'short';
const BANDS = 'ctc-band';
const RELOCATE = 'relocate';

function jobRow(job: Job) {
  return {
    id: job.id,
    title: job.title,
    description: `${job.client} · ${job.city} · ${job.ctc}`,
    set: {
      job: job.title,
      client: job.client,
      city: job.city,
      workMode: job.mode,
      ctcBand: job.ctc,
      minExp: String(job.minExp),
      skills: job.skills,
    },
  };
}

/** One role list per function; every role opens the job description. */
function jobList(fn: JobFunction): AuthorNode {
  return {
    id: `jobs-${fn.key}`,
    type: 'list',
    data: {
      header: fn.name,
      text: 'Open roles in *{{fn}}*. Salaries are yearly CTC.',
      footer: 'Kaveri never charges candidates a fee',
      button: 'View roles',
      sections: [{ id: 'roles', title: 'Open roles', rows: fn.jobs.map(jobRow) }],
    },
    next: Object.fromEntries(fn.jobs.map((j) => [j.id, 'jd'])),
  };
}

/** Experience gate for a role that needs `years`: fewer goes to "not yet". */
function experienceGate(years: number): AuthorNode {
  return {
    id: `gate-${years}`,
    type: 'condition',
    data: { cases: [{ id: 'under', var: 'expYears', op: 'lt', value: String(years) }] },
    next: { under: NOT_YET, else: SHORTLIST },
  };
}

export const apply = defineWorkflow({
  key: 'apply',
  name: 'Find a job & apply',
  description: '12 open roles — apply in two minutes',
  keywords: ['job', 'jobs', 'apply', 'opening', 'vacancy', 'naukri', 'hiring', 'career'],
  nodes: [
    {
      id: FUNCTION,
      type: 'list',
      data: {
        header: 'Open roles',
        text: 'Hi {{user.firstName}}! We are hiring for 12 roles across top companies. Which area interests you?',
        footer: 'New roles every Monday',
        button: 'Choose area',
        sections: [
          {
            id: 'functions',
            title: 'Functions',
            rows: ALL_FUNCTIONS.map((fn) => ({
              id: fn.key,
              title: fn.name,
              description: fn.description,
              set: { fn: fn.name, fnKey: fn.key },
            })),
          },
        ],
      },
      next: Object.fromEntries(ALL_FUNCTIONS.map((fn) => [fn.key, 'route'])),
    },
    {
      id: 'route',
      type: 'condition',
      data: {
        note: 'One case per function; anything else is Operations & Finance.',
        cases: FUNCTIONS.map((fn) => ({
          id: fn.key,
          var: 'fnKey',
          op: 'eq' as const,
          value: fn.key,
        })),
      },
      next: {
        ...Object.fromEntries(FUNCTIONS.map((fn) => [fn.key, `jobs-${fn.key}`])),
        else: `jobs-${OPERATIONS.key}`,
      },
    },
    ...ALL_FUNCTIONS.map(jobList),
    {
      id: 'jd',
      type: 'document',
      data: {
        document: {
          fileName: 'Job_Description.pdf',
          fileType: 'PDF',
          pages: 2,
          sizeKb: 164,
          preview: {
            title: '{{job}}',
            subtitle: '{{client}} · via Kaveri Talent Partners',
            sections: [
              {
                kind: 'fields',
                heading: 'At a glance',
                fields: [
                  { label: 'Location', value: '{{city}} ({{workMode}})' },
                  { label: 'CTC', value: '{{ctcBand}}' },
                  { label: 'Experience', value: '{{minExp}}+ years' },
                  { label: 'Skills', value: '{{skills}}' },
                  { label: 'Interview', value: '3–4 rounds, decision within 10 days' },
                ],
              },
              {
                kind: 'text',
                heading: 'About the role',
                text: 'You will join a fast-growing team, own outcomes end to end and work closely with the leadership. Benefits include health insurance for your family, a learning budget, flexible hours and 24 days of paid leave.',
              },
            ],
            footer: 'Equal opportunity employer · kaveritalent.example/jobs',
          },
        },
        caption: '*{{job}}* at {{client}} — {{city}}, {{workMode}}, {{ctcBand}}.',
      },
      next: 'jd-next',
    },
    {
      id: 'jd-next',
      type: 'buttons',
      data: {
        text: 'Interested? Applying takes four quick questions.',
        buttons: [
          { id: 'apply', title: 'Apply now' },
          { id: 'other', title: 'Other roles' },
          { id: 'ask', title: 'Ask a recruiter' },
        ],
      },
      next: { apply: 'consent', other: FUNCTION, ask: 'recruiter' },
    },
    {
      id: 'consent',
      type: 'notice',
      data: {
        text: 'Your answers are shared only with the hiring team at {{client}}. Read our privacy policy at kaveritalent.example/privacy.',
      },
      next: 'exp',
    },
    {
      id: 'exp',
      type: 'input',
      data: {
        prompt:
          '*Question 1 of 4*\nHow many years of relevant experience do you have? Type a number, e.g. 4 or 2.5.',
        var: 'expYears',
        kind: 'number',
        error: 'Please type the years as a number, e.g. 3 or 0 if you are a fresher.',
      },
      next: 'notice',
    },
    {
      id: 'notice',
      type: 'buttons',
      data: {
        header: 'Question 2 of 4',
        text: 'What is your notice period?',
        buttons: [
          { id: 'now', title: 'Immediate joiner', set: { noticePeriod: 'Immediate' } },
          { id: '30', title: '30 days or less', set: { noticePeriod: '30 days' } },
          { id: '90', title: '60–90 days', set: { noticePeriod: '60–90 days' } },
        ],
      },
      next: { now: 'ctc', '30': 'ctc', '90': 'ctc' },
    },
    {
      id: 'ctc',
      type: 'ai',
      data: {
        set: { ctc: 'Open to discussion' },
        prompt:
          '*Question 3 of 4*\nWhat is your expected CTC? Type it any way you like — "14 LPA", "1.2 lakh per month", "negotiable".',
        intents: [
          { id: 'stated', description: 'States an expected salary or range' },
          { id: 'negotiable', description: 'Open, flexible or as per company norms' },
          { id: 'ask', description: 'Asks what the salary range for the role is' },
        ],
        entities: [
          {
            name: 'ctc',
            kind: 'text',
            description: 'Expected yearly CTC in rupees, e.g. "₹14 LPA"; convert monthly figures',
          },
        ],
        retry: 'Sorry, I could not read a salary from that. Please pick a band instead.',
      },
      next: { stated: RELOCATE, negotiable: RELOCATE, ask: 'ctc-info', fallback: BANDS },
    },
    {
      id: 'ctc-info',
      type: 'text',
      data: {
        text: 'The budget for {{job}} is *{{ctcBand}}*, depending on experience and the interviews.',
      },
      next: BANDS,
    },
    {
      id: BANDS,
      type: 'list',
      data: {
        text: 'Which band fits your expected CTC?',
        button: 'Choose band',
        sections: [
          {
            id: 'bands',
            title: 'Yearly CTC',
            rows: CTC_BANDS.map((b) => ({ ...b, set: { ctc: b.title } })),
          },
        ],
      },
      next: Object.fromEntries(CTC_BANDS.map((b) => [b.id, RELOCATE])),
    },
    {
      id: RELOCATE,
      type: 'buttons',
      data: {
        header: 'Question 4 of 4',
        text: '{{job}} is *{{workMode}}*, based in {{city}}. Does that work for you?',
        buttons: [
          { id: 'yes', title: 'Yes, works for me', set: { relocate: 'yes' } },
          { id: 'move', title: 'Will relocate', set: { relocate: 'relocating' } },
          { id: 'no', title: 'No', set: { relocate: 'no' } },
        ],
      },
      next: { yes: 'location-check', move: 'location-check', no: 'location-check' },
    },
    {
      id: 'location-check',
      type: 'condition',
      data: {
        note: 'Remote roles skip the location gate.',
        cases: [
          { id: 'remote', var: 'workMode', op: 'eq', value: 'remote' },
          { id: 'no', var: 'relocate', op: 'eq', value: 'no' },
        ],
      },
      next: { remote: 'exp-gate', no: 'location-no', else: 'exp-gate' },
    },
    {
      id: 'exp-gate',
      type: 'condition',
      data: {
        note: 'Roles need 0, 3 or 5 years.',
        cases: [
          { id: 'five', var: 'minExp', op: 'eq', value: '5' },
          { id: 'three', var: 'minExp', op: 'eq', value: '3' },
        ],
      },
      next: { five: 'gate-5', three: 'gate-3', else: SHORTLIST },
    },
    experienceGate(5),
    experienceGate(3),
    {
      id: SHORTLIST,
      type: 'ticket',
      data: {
        complete: true,
        set: { appId: '$id:APP' },
        ticket: {
          ticketId: '{{appId}}',
          title: 'Application shortlisted',
          subtitle: '{{job}} · {{client}}',
          fields: [
            { label: 'Candidate', value: '{{user.fullName}}' },
            { label: 'Experience (years)', value: '{{expYears}}' },
            { label: 'Notice', value: '{{noticePeriod}}' },
            { label: 'Expected CTC', value: '{{ctc}}' },
            { label: 'Location', value: '{{city}} ({{workMode}})' },
            { label: 'Recruiter', value: RECRUITER.name },
          ],
          qrData: 'https://kaveritalent.example/a/{{appId}}',
        },
        caption:
          'Great news, {{user.firstName}} — your profile matches {{job}}. Keep this reference for any questions.',
      },
      next: 'book',
    },
    {
      id: 'book',
      type: 'buttons',
      data: {
        text: 'The first round is a skills interview. Shall we book it now?',
        buttons: [
          { id: 'book', title: 'Book interview' },
          { id: 'later', title: 'Later' },
        ],
      },
      next: { book: 'to-interview', later: 'later' },
    },
    {
      id: 'to-interview',
      type: 'jump',
      data: { workflowKey: 'interview' },
    },
    {
      id: 'later',
      type: 'end',
      data: {
        text: 'Sure. Type *interview* whenever you are ready and we will pick it up from here.',
        showMenu: true,
      },
    },
    {
      id: NOT_YET,
      type: 'buttons',
      data: {
        text: 'Thanks, {{user.firstName}}. {{client}} needs at least {{minExp}} years for {{job}}, so we cannot put you forward for this one — but your profile is saved.',
        buttons: [
          { id: 'other', title: 'See other roles' },
          { id: 'alert', title: 'Send job alerts' },
          { id: 'menu', title: 'Main menu' },
        ],
      },
      next: { other: FUNCTION, alert: 'alert', menu: 'menu-end' },
    },
    {
      id: 'location-no',
      type: 'buttons',
      data: {
        text: 'Understood — {{job}} needs you in {{city}}. Shall we show you other roles, or send alerts for remote jobs?',
        buttons: [
          { id: 'other', title: 'See other roles' },
          { id: 'alert', title: 'Send job alerts' },
          { id: 'menu', title: 'Main menu' },
        ],
      },
      next: { other: FUNCTION, alert: 'alert', menu: 'menu-end' },
    },
    {
      id: 'alert',
      type: 'reminder',
      data: {
        afterMs: 15_000,
        label: 'New job that matches you',
        note: 'Real use: when a matching role opens.',
      },
      next: { next: 'alert-set', later: 'alert-push' },
    },
    {
      id: 'alert-set',
      type: 'end',
      data: {
        text: 'Done — we will message you here when a matching role opens.',
        showMenu: true,
      },
    },
    {
      id: 'alert-push',
      type: 'image',
      data: {
        image: {
          icon: 'bell',
          accent: 'purple',
          title: 'New role for you',
          subtitle: 'Data Analyst · Cartwheel Retail',
        },
        caption:
          'Hi {{user.firstName}}, a new role matches your profile: *Data Analyst* at Cartwheel Retail, Pune, ₹7–11 LPA. Freshers welcome.',
      },
      next: 'alert-next',
    },
    {
      id: 'alert-next',
      type: 'buttons',
      data: {
        text: 'Would you like to see it?',
        buttons: [
          { id: 'view', title: 'View roles' },
          { id: 'no', title: 'Not now' },
        ],
      },
      next: { view: FUNCTION, no: 'menu-end' },
    },
    {
      id: 'recruiter',
      type: 'handoff',
      data: {
        agentName: RECRUITER.agentName,
        text: "Hi {{user.firstName}}, I'm Shruti, the recruiter for {{job}} at {{client}}. Ask me anything — the team, the interview or the pay.",
      },
      next: 'recruiter-card',
    },
    {
      id: 'recruiter-card',
      type: 'contact',
      data: {
        contact: {
          name: RECRUITER.name,
          phone: RECRUITER.phone,
          role: RECRUITER.role,
          organisation: 'Kaveri Talent Partners',
        },
      },
      next: 'recruiter-cta',
    },
    {
      id: 'recruiter-cta',
      type: 'cta',
      data: {
        text: 'You can also browse every open role on our website.',
        actions: [
          { kind: 'call', title: 'Call Shruti', phone: RECRUITER.phone },
          { kind: 'url', title: 'All jobs', url: AGENCY.jobs },
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
