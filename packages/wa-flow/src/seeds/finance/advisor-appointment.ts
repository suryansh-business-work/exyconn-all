/**
 * Advisor appointment: topic → advisor card → branch, video or phone → day → slot → where to
 * send the invite (profile email or a typed one) → review → QR ticket, calendar, branch pin /
 * video link / call note, a prep list → reminder push to confirm, reschedule or cancel.
 */
import { defineWorkflow } from '../../author';
import { ADVISORS, FIRM, type Advisor } from './data';

const DAY = 'day';
const REVIEW = 'review';

function advisorRow(advisor: Advisor) {
  return {
    id: advisor.id,
    title: advisor.topic,
    description: advisor.description,
    set: {
      topic: advisor.topic,
      advisor: advisor.name,
      advisorCreds: advisor.credentials,
      advisorYears: String(advisor.years),
    },
  };
}

export const advisorAppointment = defineWorkflow({
  key: 'advisor-appointment',
  name: 'Meet an advisor',
  description: 'Free first meeting on investments, tax, loans or cover',
  keywords: [
    'advisor',
    'adviser',
    'financial planning',
    'investment',
    'tax',
    'retirement',
    'meeting',
  ],
  nodes: [
    {
      id: 'topic',
      type: 'list',
      data: {
        header: 'Meet an advisor',
        text: 'Hi {{user.firstName}}, what would you like to talk about? Your first 30-minute meeting is free.',
        footer: 'Advisors are certified; advice is personal to you',
        button: 'Choose topic',
        sections: [{ id: 'topics', title: 'Topics', rows: ADVISORS.map(advisorRow) }],
      },
      next: Object.fromEntries(ADVISORS.map((a) => [a.id, 'profile'])),
    },
    {
      id: 'profile',
      type: 'image',
      data: {
        image: {
          icon: 'bank',
          accent: 'green',
          title: '{{advisor}}',
          subtitle: '{{advisorCreds}}',
        },
        caption:
          '{{advisor}} will meet you about {{topic|lower}} — {{advisorYears}} years of experience. Languages: English, Hindi, Gujarati.',
      },
      next: 'mode',
    },
    {
      id: 'mode',
      type: 'buttons',
      data: {
        text: 'How would you like to meet?',
        buttons: [
          {
            id: 'branch',
            title: 'At the branch',
            set: { mode: 'branch', modeLabel: 'SG Highway branch' },
          },
          { id: 'video', title: 'Video call', set: { mode: 'video', modeLabel: 'Video call' } },
          { id: 'phone', title: 'Phone call', set: { mode: 'phone', modeLabel: 'Phone call' } },
        ],
      },
      next: { branch: DAY, video: DAY, phone: DAY },
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day suits you to meet {{advisor}}?',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, skipSundays: true, var: 'day' },
      },
      next: { pick: 'slot' },
    },
    {
      id: 'slot',
      type: 'list',
      data: {
        text: "{{advisor}}'s free slots on {{dayLabel}} (IST):",
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
          to: 19,
          stepMin: 30,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 'invite', 'other-day': DAY },
    },
    {
      id: 'invite',
      type: 'buttons',
      data: {
        text: 'Where should we send the meeting invite? Your profile email is {{user.email}}.',
        buttons: [
          { id: 'profile', title: 'Use this email', set: { inviteEmail: '{{user.email}}' } },
          { id: 'other', title: 'Another email' },
        ],
      },
      next: { profile: REVIEW, other: 'email' },
    },
    {
      id: 'email',
      type: 'input',
      data: {
        prompt: 'Please type the email address for the invite.',
        var: 'inviteEmail',
        kind: 'email',
      },
      next: REVIEW,
    },
    {
      id: REVIEW,
      type: 'buttons',
      data: {
        header: 'Check your meeting',
        text: '*Topic:* {{topic}}\n*Advisor:* {{advisor}}\n*How:* {{modeLabel}}\n*When:* {{dayLabel}} at {{slot|time}}\n*Invite to:* {{inviteEmail}}\n*Fee:* Free first meeting',
        buttons: [
          { id: 'confirm', title: 'Confirm' },
          { id: 'change', title: 'Change time' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'ticket', change: DAY, cancel: 'not-booked' },
    },
    {
      id: 'ticket',
      type: 'ticket',
      data: {
        set: { meetingId: '$id:ADV' },
        complete: true,
        ticket: {
          ticketId: '{{meetingId}}',
          title: 'Meeting confirmed',
          subtitle: 'Kosh Finserv · {{topic}}',
          fields: [
            { label: 'Client', value: '{{user.fullName}}' },
            { label: 'Advisor', value: '{{advisor}}' },
            { label: 'How', value: '{{modeLabel}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Invite sent to', value: '{{inviteEmail}}' },
          ],
          qrData: 'kosh://meeting/{{meetingId}}?slot={{slot}}',
        },
        caption: 'The invite is on its way to {{inviteEmail}}.',
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Add it to your calendar, or call us if anything changes.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: '{{topic}} — {{advisor}}',
              start: '{{slot}}',
              durationMin: 30,
              location: '{{modeLabel}}',
            },
          },
          { kind: 'call', title: 'Call Kosh Finserv', phone: FIRM.phone },
        ],
      },
      next: 'mode-check',
    },
    {
      id: 'mode-check',
      type: 'condition',
      data: {
        cases: [
          { id: 'video', var: 'mode', op: 'eq', value: 'video' },
          { id: 'phone', var: 'mode', op: 'eq', value: 'phone' },
        ],
      },
      next: { video: 'video-link', phone: 'phone-note', else: 'pin' },
    },
    {
      id: 'video-link',
      type: 'cta',
      data: {
        text: 'Join from this link at {{slot|time}}. Screen sharing is on, so {{advisor}} can walk you through the numbers.',
        actions: [{ kind: 'url', title: 'Join video call', url: FIRM.video }],
      },
      next: 'prep',
    },
    {
      id: 'phone-note',
      type: 'text',
      data: {
        set: { callFrom: FIRM.phone },
        text: '{{advisor}} will call you at {{slot|time}} from {{callFrom}}.',
      },
      next: 'prep',
    },
    {
      id: 'pin',
      type: 'location',
      data: {
        location: { name: FIRM.name, address: FIRM.address, lat: FIRM.lat, lng: FIRM.lng },
        caption:
          'Seventh floor, Titanium Heights. Visitor parking in the basement — show this chat at the gate.',
      },
      next: 'prep',
    },
    {
      id: 'prep',
      type: 'text',
      data: {
        text: 'To make the most of the meeting, keep handy:\n• Your monthly income and fixed expenses\n• Current investments, loans and insurance policies\n• Goals with rough dates — a home, children’s education, retirement',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Advisor meeting tomorrow',
        note: 'Real use: the day before.',
      },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'You are booked, {{user.firstName}}. We will remind you the day before.',
        showMenu: true,
      },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Meeting tomorrow',
        text: 'Reminder: your {{topic|lower}} meeting with {{advisor}} is tomorrow at {{slot|time}} ({{modeLabel}}).',
        buttons: [
          { id: 'confirm', title: 'Confirm' },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'r-ok', reschedule: 're-day', cancel: 'r-cancelled' },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: { text: 'Thank you. {{advisor}} looks forward to meeting you.', showMenu: true },
    },
    {
      id: 're-day',
      type: 'list',
      data: {
        text: 'Pick a new day for your meeting with {{advisor}}.',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, skipSundays: true, var: 'day' },
      },
      next: { pick: 're-slot' },
    },
    {
      id: 're-slot',
      type: 'list',
      data: {
        text: 'Free slots on {{dayLabel}}:',
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
          to: 19,
          stepMin: 30,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 're-done', 'other-day': 're-day' },
    },
    {
      id: 're-done',
      type: 'end',
      data: {
        text: 'Done — moved to {{dayLabel}} at {{slot|time}}. A new invite is on its way.',
        showMenu: true,
      },
    },
    {
      id: 'r-cancelled',
      type: 'end',
      data: {
        text: 'Your meeting {{meetingId}} is cancelled. Book again from the menu any time.',
        showMenu: true,
      },
    },
    {
      id: 'not-booked',
      type: 'end',
      data: {
        text: 'No meeting was booked. You can start again from the menu at any time.',
        showMenu: true,
      },
    },
  ],
});
