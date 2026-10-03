/**
 * Counter token booking: service (or the one chosen in the checklist) → office → day → slot →
 * applicant (the signed-in citizen or someone else) → review → QR token → office pin and
 * calendar → a "your turn is near" push that can confirm, reschedule or cancel.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import { ALL_SERVICES, CIVIC, OFFICES, serviceRow, type Office } from './data';

const OFFICE = 'office';
const DAY = 'day';
const [HQ, ...BRANCHES] = OFFICES;

function officePin(office: Office): AuthorNode {
  return {
    id: `pin-${office.id}`,
    type: 'location',
    data: {
      location: {
        name: office.name,
        address: office.address,
        lat: office.lat,
        lng: office.lng,
      },
      caption:
        'Enter by the citizen services gate. Token screens are in the main hall; wait for {{counter}} to call your number.',
    },
    next: 'calendar',
  };
}

export const token = defineWorkflow({
  key: 'token',
  name: 'Book a counter token',
  description: 'Skip the queue at any civic office',
  keywords: ['token', 'appointment', 'queue', 'counter', 'visit office', 'book slot'],
  nodes: [
    {
      id: 'preset',
      type: 'condition',
      data: {
        note: 'Coming from the document checklist, the service is already chosen.',
        set: { applicant: '' },
        cases: [{ id: 'chosen', var: 'svcFrom', op: 'eq', value: 'checklist' }],
      },
      next: { chosen: OFFICE, else: 'service' },
    },
    {
      id: 'service',
      type: 'list',
      data: {
        header: 'Book a counter token',
        text: 'Namaste {{user.firstName}}. A token gives you a fixed time at the counter — no waiting in line. Which service do you need?',
        footer: 'Offices open Mon–Sat, 10 am – 5 pm',
        button: 'Choose service',
        sections: [{ id: 'services', title: 'Services', rows: ALL_SERVICES.map(serviceRow) }],
      },
      next: Object.fromEntries(ALL_SERVICES.map((s) => [s.id, OFFICE])),
    },
    {
      id: OFFICE,
      type: 'list',
      data: {
        set: { svcFrom: '' },
        text: 'Which office would you like to visit for *{{service}}*?',
        button: 'Choose office',
        sections: [
          {
            id: 'offices',
            title: 'Offices',
            rows: OFFICES.map((o) => ({
              id: o.id,
              title: o.name,
              description: o.area,
              set: { officeId: o.id, office: o.name },
            })),
          },
        ],
      },
      next: Object.fromEntries(OFFICES.map((o) => [o.id, DAY])),
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day? Offices are closed on Sundays and public holidays.',
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
        text: 'Free counter times at {{office}} on {{dayLabel}}:',
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
          to: 17,
          stepMin: 15,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 'has-applicant', 'other-day': DAY },
    },
    {
      id: 'has-applicant',
      type: 'condition',
      data: {
        note: 'A changed or rescheduled time keeps the applicant already given.',
        cases: [{ id: 'known', var: 'applicant', op: 'notEmpty' }],
      },
      next: { known: 'review', else: 'who' },
    },
    {
      id: 'who',
      type: 'buttons',
      data: {
        text: 'Who is the applicant? Book for yourself ({{user.fullName}}) or for a family member.',
        buttons: [
          { id: 'self', title: 'Myself', set: { applicant: '{{user.fullName}}' } },
          { id: 'other', title: 'Family member' },
        ],
      },
      next: { self: 'review', other: 'applicant' },
    },
    {
      id: 'applicant',
      type: 'input',
      data: {
        prompt: "Please type the applicant's full name, as on their ID.",
        var: 'applicant',
        kind: 'name',
      },
      next: 'review',
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check your token',
        text: '*Service:* {{service}}\n*Applicant:* {{applicant}}\n*Office:* {{office}}, {{counter}}\n*When:* {{dayLabel}} at {{slot|time}}\n*Fee:* {{feeLabel}}, paid at the counter',
        footer: 'Bring originals of every document',
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
        complete: true,
        set: { tokenId: '$id:TKN', tokenNo: '$int:12:85' },
        ticket: {
          ticketId: '{{tokenId}}',
          title: 'Token {{tokenNo}}',
          subtitle: '{{service}} · {{office}}',
          fields: [
            { label: 'Applicant', value: '{{applicant}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Counter', value: '{{counter}}' },
            { label: 'Fee', value: '{{feeLabel}}' },
            { label: 'Usually takes', value: '{{timeline}}' },
          ],
          qrData: 'https://sundarpur-civic.example/t/{{tokenId}}?n={{tokenNo}}',
        },
        caption: 'Scan this QR at the kiosk when you arrive. Please come 10 minutes early.',
      },
      next: 'pin-route',
    },
    {
      id: 'pin-route',
      type: 'condition',
      data: {
        cases: BRANCHES.map((o) => ({ id: o.id, var: 'officeId', op: 'eq' as const, value: o.id })),
      },
      next: {
        ...Object.fromEntries(BRANCHES.map((o) => [o.id, `pin-${o.id}`])),
        else: `pin-${HQ.id}`,
      },
    },
    ...OFFICES.map(officePin),
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Add the visit to your calendar, or call the help desk with any questions.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: '{{service}} — token {{tokenNo}}',
              start: '{{slot}}',
              durationMin: 15,
              location: '{{office}}',
            },
          },
          { kind: 'call', title: 'Call help desk', phone: CIVIC.helpline },
        ],
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Your turn is near',
        note: 'Real use: when 3 tokens are ahead of yours.',
      },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'Your token is booked, {{user.firstName}}. We will message you when your turn is near.',
        showMenu: true,
      },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Token {{tokenNo}}',
        text: '3 tokens ahead of you at {{counter}}, {{office}}. Expected call: about 12 minutes.',
        buttons: [
          { id: 'coming', title: 'On my way' },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'cancel', title: 'Cancel token' },
        ],
      },
      next: { coming: 'r-ok', reschedule: DAY, cancel: 'r-cancel' },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: {
        text: 'Thank you. Please wait near the token screen — {{counter}} will call {{tokenNo}}.',
        showMenu: true,
      },
    },
    {
      id: 'r-cancel',
      type: 'end',
      data: {
        text: 'Token {{tokenNo}} is cancelled and the slot is released for others. Thank you.',
        showMenu: true,
      },
    },
    {
      id: 'not-booked',
      type: 'end',
      data: {
        text: 'No token was booked. You can start again from the menu at any time.',
        showMenu: true,
      },
    },
  ],
});
