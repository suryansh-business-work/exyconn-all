/**
 * Node groups more than one Aura journey repeats: picking a day and a slot, and confirming
 * who the visit is for (the signed-in user, or someone else).
 */
import type { AuthorNode } from '../../author';

/** Clinic hours, IST: Mon–Sat, 10 am – 8 pm. */
export const OPEN_HOUR = 10;
export const CLOSE_HOUR = 20;

interface SlotPicker {
  day: string;
  slot: string;
  /** Where a picked slot goes. */
  next: string;
  dayText: string;
  slotText: string;
  stepMin: number;
}

/** A day list (next 7 working days) and a slot list for that day, with "Pick another day". */
export function slotPicker(p: Readonly<SlotPicker>): AuthorNode[] {
  return [
    {
      id: p.day,
      type: 'list',
      data: {
        text: p.dayText,
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, skipSundays: true, var: 'day' },
      },
      next: { pick: p.slot },
    },
    {
      id: p.slot,
      type: 'list',
      data: {
        text: p.slotText,
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
          from: OPEN_HOUR,
          to: CLOSE_HOUR,
          stepMin: p.stepMin,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: p.next, 'other-day': p.day },
    },
  ];
}

/**
 * "Who is this for?" → the user (asking for a phone if the profile has none) or someone else
 * (name, phone, date of birth). Every path ends at `review` with `patientName` and
 * `patientPhone` set. Node ids: `who`, `own-phone`, `ask-phone`, `p-name`, `p-phone`, `p-dob`,
 * `p-ok`.
 */
export function patientNodes(review: string, visit: string): AuthorNode[] {
  return [
    {
      id: 'who',
      type: 'buttons',
      data: {
        text: `Who is the ${visit} for? Book for yourself ({{user.fullName}}) or for a family member.`,
        buttons: [
          {
            id: 'self',
            title: 'Myself',
            set: { patientName: '{{user.fullName}}', patientPhone: '{{user.phone}}' },
          },
          { id: 'other', title: 'Someone else' },
        ],
      },
      next: { self: 'own-phone', other: 'p-name' },
    },
    {
      id: 'own-phone',
      type: 'condition',
      data: {
        note: 'The signed-in profile may have no phone; ask for one then.',
        cases: [{ id: 'missing', var: 'patientPhone', op: 'empty' }],
      },
      next: { missing: 'ask-phone', else: review },
    },
    {
      id: 'ask-phone',
      type: 'input',
      data: {
        prompt: 'Which mobile number should we send the visit updates to?',
        var: 'patientPhone',
        kind: 'phone',
      },
      next: review,
    },
    {
      id: 'p-name',
      type: 'input',
      data: { prompt: "Please type the patient's full name.", var: 'patientName', kind: 'name' },
      next: 'p-phone',
    },
    {
      id: 'p-phone',
      type: 'input',
      data: {
        prompt: "{{patientName}}'s mobile number? We send reminders and aftercare there too.",
        var: 'patientPhone',
        kind: 'phone',
      },
      next: 'p-dob',
    },
    {
      id: 'p-dob',
      type: 'input',
      data: {
        prompt: "And {{patientName}}'s date of birth (DD/MM/YYYY)?",
        var: 'patientDob',
        kind: 'date',
        past: true,
        error: 'Please type a date of birth in the past as DD/MM/YYYY, e.g. 21/03/2012.',
      },
      next: 'p-ok',
    },
    {
      id: 'p-ok',
      type: 'text',
      data: { text: 'Thanks. Booking for {{patientName}}, born {{patientDob}}.' },
      next: review,
    },
  ];
}
