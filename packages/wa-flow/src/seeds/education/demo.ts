/**
 * Free demo class: course → for me or my child (name) → class → online or at the centre →
 * day → slot → demo pass QR → join link or map pin, calendar → a reminder push before the
 * class that joins, reschedules or offers a recorded class instead.
 */
import { defineWorkflow } from '../../author';
import { ACADEMY, ALL_COURSES, CLASSES, courseSections } from './data';

const WHO = 'who';
const GRADE = 'grade';
const MODE = 'mode';
const DAY = 'day';
const SLOT = 'slot';

export const demo = defineWorkflow({
  key: 'demo',
  name: 'Free demo class',
  description: 'Try a live class online or at our Pune centre',
  keywords: ['demo', 'demo class', 'trial class', 'free class', 'sample class', 'try a class'],
  nodes: [
    {
      id: 'course',
      type: 'list',
      data: {
        header: 'Free demo class',
        text: 'Hi {{user.firstName}}! Sit in on a real 60-minute class with our faculty — free, no commitment. Which course?',
        footer: 'Demo classes Mon–Sat, 4–8 pm',
        button: 'Courses',
        sections: courseSections(),
      },
      next: Object.fromEntries(ALL_COURSES.map((c) => [c.id, WHO])),
    },
    {
      id: WHO,
      type: 'buttons',
      data: {
        text: 'Who will attend the *{{course}}* demo?',
        buttons: [
          { id: 'me', title: 'Me', set: { student: '{{user.fullName}}' } },
          { id: 'child', title: 'My child' },
        ],
      },
      next: { me: GRADE, child: 'child-name' },
    },
    {
      id: 'child-name',
      type: 'input',
      data: { prompt: "Your child's full name?", var: 'student', kind: 'name' },
      next: GRADE,
    },
    {
      id: GRADE,
      type: 'list',
      data: {
        text: 'Which class is {{student}} in right now?',
        button: 'Class',
        sections: [
          {
            id: 'classes',
            title: 'Current class',
            rows: CLASSES.map((c) => ({ id: c.id, title: c.title, set: { grade: c.title } })),
          },
        ],
      },
      next: Object.fromEntries(CLASSES.map((c) => [c.id, MODE])),
    },
    {
      id: MODE,
      type: 'buttons',
      data: {
        text: 'Online from home, or at our Erandwane centre?',
        buttons: [
          { id: 'online', title: 'Online', set: { mode: 'online', modeLabel: 'Online (live)' } },
          {
            id: 'centre',
            title: 'At the centre',
            set: { mode: 'centre', modeLabel: 'Erandwane centre' },
          },
        ],
      },
      next: { online: DAY, centre: DAY },
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Pick a day for the demo:',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 6, skipSundays: true, var: 'day' },
      },
      next: { pick: SLOT },
    },
    {
      id: SLOT,
      type: 'list',
      data: {
        text: 'Demo batches for {{course}} on {{dayLabel}}:',
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
          from: 16,
          to: 20,
          stepMin: 60,
          take: 4,
          var: 'slot',
        },
      },
      next: { pick: 'pass', 'other-day': DAY },
    },
    {
      id: 'pass',
      type: 'ticket',
      data: {
        complete: true,
        set: {
          demoId: '$id:BPD',
          faculty: '$pick:Prof. Anand Rao|Dr. Meera Iyer|Prof. Kunal Shah',
        },
        ticket: {
          ticketId: '{{demoId}}',
          title: 'Demo class booked',
          subtitle: '{{course}} · BrightPath Academy',
          fields: [
            { label: 'Student', value: '{{student}}' },
            { label: 'Class', value: '{{grade}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Where', value: '{{modeLabel}}' },
            { label: 'Faculty', value: '{{faculty}}' },
          ],
          qrData: 'brightpath://demo/{{demoId}}?slot={{slot}}',
        },
        caption:
          'Your demo pass. Keep a notebook handy — there is a 10-minute quiz at the end, with instant feedback.',
      },
      next: 'where',
    },
    {
      id: 'where',
      type: 'condition',
      data: { cases: [{ id: 'online', var: 'mode', op: 'eq', value: 'online' }] },
      next: { online: 'online-cta', else: 'centre-pin' },
    },
    {
      id: 'online-cta',
      type: 'cta',
      data: {
        text: 'The link opens 10 minutes before the class. Use a laptop or tablet if you can.',
        actions: [
          { kind: 'url', title: 'Join link', url: ACADEMY.demoRoom },
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: '{{course}} demo — BrightPath',
              start: '{{slot}}',
              durationMin: 60,
              location: ACADEMY.demoRoom,
            },
          },
        ],
      },
      next: 'remind',
    },
    {
      id: 'centre-pin',
      type: 'location',
      data: {
        location: {
          name: ACADEMY.name,
          address: ACADEMY.address,
          lat: ACADEMY.lat,
          lng: ACADEMY.lng,
        },
        caption: 'Second floor, above the bank. Parents can wait in the lounge on the first floor.',
      },
      next: 'centre-cta',
    },
    {
      id: 'centre-cta',
      type: 'cta',
      data: {
        text: 'Save the class to your calendar.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: '{{course}} demo — BrightPath',
              start: '{{slot}}',
              durationMin: 60,
              location: ACADEMY.address,
            },
          },
          { kind: 'call', title: 'Call the centre', phone: ACADEMY.phone },
        ],
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Demo class reminder',
        note: 'Real use: 1 hour before the class.',
      },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'All set! We will remind {{student}} an hour before the class.',
        showMenu: true,
      },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Class in 1 hour',
        text: "{{student}}'s *{{course}}* demo with {{faculty}} starts at {{slot|time}} today ({{modeLabel}}).",
        buttons: [
          { id: 'join', title: 'We’ll be there' },
          { id: 'move', title: 'Reschedule' },
          { id: 'skip', title: 'Can’t make it' },
        ],
      },
      next: { join: 'r-join', move: DAY, skip: 'r-skip' },
    },
    {
      id: 'r-join',
      type: 'end',
      data: { text: 'Great — see you in class. All the best, {{student}}!', showMenu: true },
    },
    {
      id: 'r-skip',
      type: 'cta',
      data: {
        text: 'No problem. Meanwhile, watch a recorded class from the same course — and book another demo whenever you like.',
        actions: [{ kind: 'url', title: 'Sample classes', url: ACADEMY.recordings }],
      },
      next: 'r-skip-end',
    },
    { id: 'r-skip-end', type: 'end', data: { showMenu: true } },
  ],
});
