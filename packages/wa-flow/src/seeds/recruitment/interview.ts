/**
 * Interview scheduling: reuses the role from "Find a job & apply" (or a pending application)
 * → video, in-person or phone → day → slot → review → QR interview pass → venue pin and
 * recruiter card or a join link → prep guide PDF → an interview reminder push that confirms,
 * reschedules or withdraws.
 */
import { defineWorkflow } from '../../author';
import { AGENCY, RECRUITER, ROUNDS } from './data';

const DAY = 'day';
const PREP = 'prep';

export const interview = defineWorkflow({
  key: 'interview',
  name: 'Schedule interview',
  description: 'Pick a slot for your next interview round',
  keywords: ['interview', 'schedule interview', 'interview slot', 'round'],
  nodes: [
    {
      id: 'has-role',
      type: 'condition',
      data: {
        note: 'Reuse the role applied for in this chat; otherwise a pending application.',
        cases: [{ id: 'none', var: 'appId', op: 'empty' }],
      },
      next: { none: 'seed-role', else: 'round' },
    },
    {
      id: 'seed-role',
      type: 'text',
      data: {
        set: {
          appId: '$id:APP',
          job: '$pick:Frontend Developer|Data Analyst|Account Executive (B2B)',
          client: '$pick:Medisphere Labs|Cartwheel Retail|Voltgrid Energy',
        },
        text: 'Hi {{user.firstName}}, you have been shortlisted for *{{job}}* at {{client}} (application {{appId}}). Let us set up your interview.',
      },
      next: 'round',
    },
    {
      id: 'round',
      type: 'buttons',
      data: {
        header: 'Skills interview · 60 minutes',
        text: 'How would you like to take the interview for {{job}}?',
        footer: 'Panel: {{client}} engineering or hiring team',
        buttons: [
          {
            id: 'video',
            title: 'Video call',
            set: { mode: 'Video call', venue: 'Online — link in your invite' },
          },
          {
            id: 'office',
            title: 'In person',
            set: { mode: 'In person', venue: AGENCY.address },
          },
          {
            id: 'phone',
            title: 'Phone call',
            set: { mode: 'Phone call', venue: 'The panel calls you' },
          },
        ],
      },
      next: { video: DAY, office: DAY, phone: DAY },
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day suits you? Interviews run Monday to Saturday.',
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
        text: "Panel's free slots on {{dayLabel}} (IST):",
        button: 'Choose time',
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
          stepMin: 60,
          take: 7,
          var: 'slot',
        },
      },
      next: { pick: 'review', 'other-day': DAY },
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check your interview',
        text: '*Candidate:* {{user.fullName}}\n*Role:* {{job}}, {{client}}\n*Round:* Skills interview (60 min)\n*When:* {{dayLabel}} at {{slot|time}}\n*Mode:* {{mode}}',
        buttons: [
          { id: 'confirm', title: 'Confirm' },
          { id: 'change', title: 'Change time' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'pass', change: DAY, cancel: 'not-booked' },
    },
    {
      id: 'pass',
      type: 'ticket',
      data: {
        complete: true,
        set: { interviewId: '$id:INT' },
        ticket: {
          ticketId: '{{interviewId}}',
          title: 'Interview scheduled',
          subtitle: '{{job}} · {{client}}',
          fields: [
            { label: 'Candidate', value: '{{user.fullName}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Mode', value: '{{mode}}' },
            { label: 'Where', value: '{{venue}}' },
            { label: 'Application', value: '{{appId}}' },
          ],
          qrData: 'https://kaveritalent.example/i/{{interviewId}}',
        },
        caption:
          'Keep this pass handy. For an in-person round, show the QR at reception with a photo ID.',
      },
      next: 'mode-check',
    },
    {
      id: 'mode-check',
      type: 'condition',
      data: {
        cases: [
          { id: 'office', var: 'mode', op: 'eq', value: 'In person' },
          { id: 'video', var: 'mode', op: 'eq', value: 'Video call' },
        ],
      },
      next: { office: 'venue', video: 'join', else: 'calendar' },
    },
    {
      id: 'venue',
      type: 'location',
      data: {
        location: {
          name: AGENCY.name,
          address: AGENCY.address,
          lat: AGENCY.lat,
          lng: AGENCY.lng,
        },
        caption: 'Reception on the 3rd floor. Please arrive 15 minutes early.',
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
      next: 'calendar',
    },
    {
      id: 'join',
      type: 'cta',
      data: {
        text: 'Test your camera and mic before the call. The link opens in any browser.',
        actions: [{ kind: 'url', title: 'Interview link', url: AGENCY.interview }],
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Add the interview to your calendar.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: 'Interview — {{job}}, {{client}}',
              start: '{{slot}}',
              durationMin: 60,
              location: '{{venue}}',
            },
          },
          { kind: 'call', title: 'Call recruiter', phone: RECRUITER.phone },
        ],
      },
      next: PREP,
    },
    {
      id: PREP,
      type: 'document',
      data: {
        document: {
          fileName: 'Interview_Prep_Guide.pdf',
          fileType: 'PDF',
          pages: 3,
          sizeKb: 228,
          preview: {
            title: 'Your interview guide',
            subtitle: '{{job}} · {{client}}',
            sections: [
              {
                kind: 'table',
                heading: 'The interview loop',
                columns: ['Round', 'What', 'Length', 'Mode'],
                rows: ROUNDS.map((r) => ({ id: r.id, cells: [...r.cells] })),
              },
              {
                kind: 'text',
                heading: 'How to prepare',
                text: 'Re-read the job description, prepare two projects you are proud of with numbers, and keep questions ready for the panel. For technical roles expect a live problem — think aloud.',
              },
            ],
            footer: 'Kaveri Talent Partners · we never charge candidates',
          },
        },
        caption: 'A short guide to help you prepare. All the best, {{user.firstName}}!',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Interview reminder',
        note: 'Real use: the evening before.',
      },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'You are all set. We will remind you before the interview.',
        showMenu: true,
      },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Interview reminder',
        text: 'Reminder: your {{job}} interview with {{client}} is tomorrow at {{slot|time}} ({{mode}}).\nReference {{interviewId}}.',
        buttons: [
          { id: 'yes', title: "I'll be there" },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'withdraw', title: 'Withdraw' },
        ],
      },
      next: { yes: 'r-ok', reschedule: DAY, withdraw: 'r-withdraw' },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: { text: 'Great — all the best, {{user.firstName}}!', showMenu: true },
    },
    {
      id: 'r-withdraw',
      type: 'buttons',
      data: {
        text: 'Withdraw your application for {{job}}? You can still apply for other roles.',
        buttons: [
          { id: 'yes', title: 'Yes, withdraw' },
          { id: 'keep', title: 'Keep it' },
        ],
      },
      next: { yes: 'r-withdrawn', keep: 'r-ok' },
    },
    {
      id: 'r-withdrawn',
      type: 'end',
      data: {
        set: { appId: '' },
        text: 'Your application is withdrawn. Thank you for letting us know.',
        showMenu: true,
      },
    },
    {
      id: 'not-booked',
      type: 'end',
      data: {
        text: 'No interview was booked. Type *interview* whenever you are ready.',
        showMenu: true,
      },
    },
  ],
});
