/**
 * Meeting scheduling for existing customers: meeting type → a time typed naturally ("kal
 * shaam 5 baje", read by an `ai` node) or picked from day/slot lists → video, office or phone
 * → confirmation ticket, calendar, and a reminder push that can join, say "running late" or
 * reschedule.
 */
import { defineWorkflow } from '../../author';
import { COMPANY, CSM, MEETING_TYPES } from './data';

const DAY = 'day';
const MODE = 'mode';

export const meeting = defineWorkflow({
  key: 'meeting',
  name: 'Schedule a meeting',
  description: 'Reviews, onboarding or training with your success manager',
  keywords: ['meeting', 'schedule', 'qbr', 'onboarding', 'training', 'renewal', 'account manager'],
  nodes: [
    {
      id: 'type',
      type: 'list',
      data: {
        header: 'Schedule a meeting',
        text: 'Hi {{user.firstName}}, {{csm}} is your Customer Success Manager. What would you like to meet about?',
        set: { csm: CSM.name },
        button: 'Meeting type',
        sections: [
          {
            id: 'types',
            title: 'Meetings',
            rows: MEETING_TYPES.map((m) => ({ ...m, set: { meetingType: m.title } })),
          },
        ],
      },
      next: Object.fromEntries(MEETING_TYPES.map((m) => [m.id, 'when'])),
    },
    {
      id: 'when',
      type: 'ai',
      data: {
        set: { whenMs: '', attendees: '' },
        prompt:
          'When suits you? Type it the way you would say it — "kal shaam 5 baje", "Thursday 11 am", "next Monday morning" — or type *slots* to see open times.',
        intents: [
          { id: 'time', description: 'Proposes a specific day and time for the meeting' },
          {
            id: 'slots',
            description: 'Wants to see the available slots, or has no particular time in mind',
          },
        ],
        entities: [
          {
            name: 'when',
            kind: 'datetime',
            description: 'The proposed meeting date and time',
          },
          { name: 'attendees', kind: 'number', description: 'How many people will join, if said' },
        ],
        retry: "Sorry, I couldn't read a time from that. Here are the open slots instead.",
      },
      next: { time: 'has-time', slots: DAY, fallback: DAY },
    },
    {
      id: 'has-time',
      type: 'condition',
      data: {
        note: 'The server adds `whenMs` when it could resolve a real date-time.',
        cases: [{ id: 'missing', var: 'whenMs', op: 'empty' }],
      },
      next: { missing: DAY, else: 'ai-confirm' },
    },
    {
      id: 'ai-confirm',
      type: 'buttons',
      data: {
        text: 'Shall I book your *{{meetingType}}* with {{csm}} on *{{whenMs|day}} at {{whenMs|time}}* IST?',
        buttons: [
          {
            id: 'yes',
            title: 'Yes, book it',
            set: { slot: '{{whenMs}}', dayLabel: '{{whenMs|day}}' },
          },
          { id: 'other', title: 'See open slots' },
        ],
      },
      next: { yes: MODE, other: DAY },
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Pick a day for your {{meetingType}}.',
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
        text: "{{csm}}'s open slots on {{dayLabel}} (IST):",
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
          stepMin: 30,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: MODE, 'other-day': DAY },
    },
    {
      id: MODE,
      type: 'buttons',
      data: {
        text: 'How would you like to meet?',
        buttons: [
          {
            id: 'video',
            title: 'Video call',
            set: { mode: 'Video call', venue: COMPANY.meet },
          },
          {
            id: 'office',
            title: 'At our office',
            set: { mode: 'In person', venue: COMPANY.address },
          },
          {
            id: 'phone',
            title: 'Phone call',
            set: { mode: 'Phone call', venue: 'We will call your registered number' },
          },
        ],
      },
      next: { video: 'confirmed', office: 'office-pin', phone: 'confirmed' },
    },
    {
      id: 'office-pin',
      type: 'location',
      data: {
        location: {
          name: COMPANY.name,
          address: COMPANY.address,
          lat: COMPANY.lat,
          lng: COMPANY.lng,
        },
        caption:
          'Visitor parking at gate 2. Show the QR below at reception on the 6th floor and we will bring you up.',
      },
      next: 'confirmed',
    },
    {
      id: 'confirmed',
      type: 'ticket',
      data: {
        complete: true,
        set: { meetingId: '$id:MT' },
        ticket: {
          ticketId: '{{meetingId}}',
          title: 'Meeting confirmed',
          subtitle: '{{meetingType}} · Orbitly',
          fields: [
            { label: 'With', value: '{{csm}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}} IST' },
            { label: 'Mode', value: '{{mode}}' },
            { label: 'Where', value: '{{venue}}' },
            { label: 'Invite to', value: '{{user.email}}' },
          ],
          qrData: 'https://meet.orbitly.example/m/{{meetingId}}',
        },
        caption: 'An agenda and the invite are on their way to {{user.email}}.',
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Add it to your calendar, or call {{csm}} if anything changes.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: '{{meetingType}} — Orbitly',
              start: '{{slot}}',
              durationMin: 30,
              location: '{{venue}}',
            },
          },
          { kind: 'call', title: 'Call {{csm}}', phone: CSM.phone },
        ],
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Meeting in 15 minutes',
        note: 'Real use: 15 minutes before.',
      },
      next: { next: 'done', later: 'r-msg' },
    },
    {
      id: 'done',
      type: 'end',
      data: { text: 'All booked, {{user.firstName}}. Talk soon!', showMenu: true },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Starting soon',
        text: 'Your {{meetingType}} with {{csm}} starts at {{slot|time}} ({{mode}}).',
        buttons: [
          { id: 'join', title: 'Join now' },
          { id: 'late', title: 'Running late' },
          { id: 'reschedule', title: 'Reschedule' },
        ],
      },
      next: { join: 'r-join', late: 'r-late', reschedule: DAY },
    },
    {
      id: 'r-join',
      type: 'cta',
      data: {
        text: '{{csm}} is ready for you.',
        actions: [{ kind: 'url', title: 'Join meeting', url: COMPANY.meet }],
      },
      next: 'r-end',
    },
    {
      id: 'r-late',
      type: 'end',
      data: {
        text: 'No worries — we have told {{csm}} you will be about 10 minutes late.',
        showMenu: true,
      },
    },
    {
      id: 'r-end',
      type: 'end',
      data: { showMenu: true },
    },
  ],
});
