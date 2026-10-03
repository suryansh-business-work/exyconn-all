/**
 * Counselling session: the parent or student describes the goal in their own words ("class
 * 10, wants JEE, weak in maths") and an `ai` node picks the track; unsure or unreadable text
 * falls back to a goal list. Then a recommendation → call, video or visit → day → slot →
 * QR confirmation with the counsellor's card — or "call me now" straight to a counsellor.
 */
import { defineWorkflow } from '../../author';
import { ALL_COURSES, COUNSELLOR, courseRow } from './data';

const GOALS = 'goals';
const SESSION = 'session';
const DAY = 'day';
const NOW = 'now';

const byId = (id: string) => {
  const course = ALL_COURSES.find((c) => c.id === id);
  if (!course) {
    throw new Error(`Unknown course ${id}`);
  }
  return course;
};

/** The course an intent recommends, stored as if picked from a list. */
const recommend = (id: string) => courseRow(byId(id)).set;

export const counselling = defineWorkflow({
  key: 'counselling',
  name: 'Talk to a counsellor',
  description: 'Free 20-minute guidance on the right course and plan',
  keywords: [
    'counselling',
    'counseling',
    'counsellor',
    'guidance',
    'career',
    'which course',
    'confused',
  ],
  nodes: [
    {
      id: 'ask',
      type: 'ai',
      data: {
        prompt:
          'Hi {{user.firstName}}, tell me about the student in a line — class, goal and anything they find hard. e.g. "class 10, wants JEE, weak in maths".',
        intents: [
          { id: 'jee', description: 'Engineering, IIT, JEE or MHT-CET' },
          { id: 'neet', description: 'Medical, doctor, MBBS or NEET' },
          { id: 'school', description: 'School marks, boards, Olympiad, class 8–10 foundation' },
          { id: 'skills', description: 'Coding, computers, spoken English or confidence' },
          { id: 'unsure', description: 'Not sure what to choose, wants general advice' },
        ],
        entities: [],
        retry: 'Thanks! Let me narrow it down with a quick question.',
      },
      next: {
        jee: 'rec-jee',
        neet: 'rec-neet',
        school: 'rec-school',
        skills: 'rec-skills',
        unsure: GOALS,
        fallback: GOALS,
      },
    },
    {
      id: GOALS,
      type: 'list',
      data: {
        text: "What is the student's main goal?",
        button: 'Goals',
        sections: [
          {
            id: 'goals',
            title: 'Goal',
            rows: [
              { id: 'jee', title: 'Engineering (JEE/CET)' },
              { id: 'neet', title: 'Medical (NEET)' },
              { id: 'school', title: 'Better school marks' },
              { id: 'skills', title: 'Coding or English' },
              { id: 'call', title: 'Just call me', description: 'A counsellor calls you now' },
            ],
          },
        ],
      },
      next: {
        jee: 'rec-jee',
        neet: 'rec-neet',
        school: 'rec-school',
        skills: 'rec-skills',
        call: NOW,
      },
    },
    {
      id: 'rec-jee',
      type: 'text',
      data: {
        set: recommend('jee'),
        text: 'For engineering, our *{{course}}* programme ({{courseGrades}}, {{duration}}) is the best fit — small batches of 30, weekly tests and doubt clinics every evening.',
      },
      next: SESSION,
    },
    {
      id: 'rec-neet',
      type: 'text',
      data: {
        set: recommend('neet'),
        text: 'For medicine, our *{{course}}* programme ({{courseGrades}}, {{duration}}) follows NCERT line by line, with 40 full-length mock tests.',
      },
      next: SESSION,
    },
    {
      id: 'rec-school',
      type: 'text',
      data: {
        set: recommend('foundation'),
        text: 'Our *{{course}}* course builds strong Maths and Science basics for boards and Olympiads — and an early head start for JEE or NEET.',
      },
      next: SESSION,
    },
    {
      id: 'rec-skills',
      type: 'text',
      data: {
        set: recommend('coding'),
        text: 'Our *{{course}}* course is project-based: by the end, students build and publish their own game. We also run Spoken English for confidence and fluency.',
      },
      next: SESSION,
    },
    {
      id: SESSION,
      type: 'buttons',
      data: {
        text: 'A counsellor will look at the details and build a study plan with you. How would you like to meet?',
        footer: 'Free · about 20 minutes',
        buttons: [
          { id: 'phone', title: 'Phone call', set: { sessionMode: 'Phone call' } },
          { id: 'video', title: 'Video call', set: { sessionMode: 'Video call' } },
          {
            id: 'visit',
            title: 'Visit the centre',
            set: { sessionMode: 'At the Erandwane centre' },
          },
        ],
      },
      next: { phone: DAY, video: DAY, visit: DAY },
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day suits you?',
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
        text: 'Free counselling slots on {{dayLabel}}:',
        button: 'Choose time',
        sections: [
          {
            id: 'more',
            title: 'More options',
            rows: [
              { id: 'other-day', title: 'Pick another day' },
              { id: 'now', title: 'Call me now instead' },
            ],
          },
        ],
        dynamic: {
          kind: 'slots',
          dayVar: 'day',
          from: 10,
          to: 19,
          stepMin: 30,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 'phone-check', 'other-day': DAY, now: NOW },
    },
    {
      id: 'phone-check',
      type: 'condition',
      data: { cases: [{ id: 'missing', var: 'user.phone', op: 'empty' }] },
      next: { missing: 'ask-phone', else: 'use-phone' },
    },
    {
      id: 'use-phone',
      type: 'delay',
      data: { ms: 200, set: { contactPhone: '{{user.phone}}' } },
      next: 'confirmed',
    },
    {
      id: 'ask-phone',
      type: 'input',
      data: {
        prompt: 'Which number should the counsellor call or WhatsApp?',
        var: 'contactPhone',
        kind: 'phone',
      },
      next: 'confirmed',
    },
    {
      id: 'confirmed',
      type: 'ticket',
      data: {
        complete: true,
        set: { sessionId: '$id:BPC' },
        ticket: {
          ticketId: '{{sessionId}}',
          title: 'Counselling booked',
          subtitle: 'BrightPath Academy',
          fields: [
            { label: 'For', value: '{{user.fullName}}' },
            { label: 'Course', value: '{{course}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Mode', value: '{{sessionMode}}' },
            { label: 'Phone', value: '{{contactPhone}}' },
          ],
          qrData: 'brightpath://counselling/{{sessionId}}?slot={{slot}}',
        },
        caption: 'Please keep the latest report card handy — it helps us plan.',
      },
      next: 'card',
    },
    {
      id: 'card',
      type: 'contact',
      data: {
        contact: {
          name: COUNSELLOR.name,
          phone: COUNSELLOR.phone,
          role: COUNSELLOR.role,
          organisation: 'BrightPath Academy',
        },
      },
      next: 'done',
    },
    {
      id: 'done',
      type: 'end',
      data: {
        text: 'Sneha will be your counsellor. Save her number so you know it is us calling.',
        showMenu: true,
      },
    },
    {
      id: NOW,
      type: 'handoff',
      data: {
        agentName: COUNSELLOR.agentName,
        text: "Hi {{user.firstName}}, I'm Sneha, a counsellor at BrightPath. Tell me the student's class and what you are hoping for — I can call you in the next few minutes if that is easier.",
      },
      next: 'now-cta',
    },
    {
      id: 'now-cta',
      type: 'cta',
      data: {
        text: 'Or call me directly:',
        actions: [{ kind: 'call', title: 'Call Sneha', phone: COUNSELLOR.phone }],
      },
      next: 'now-end',
    },
    { id: 'now-end', type: 'end', data: { showMenu: true } },
  ],
});
