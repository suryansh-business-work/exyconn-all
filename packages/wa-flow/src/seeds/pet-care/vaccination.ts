/**
 * Vaccination reminders: dog or cat → name → date of birth → schedule PDF → due vaccine →
 * day → slot → review → QR ticket → opt in to dose reminders → a "booster due" push that can
 * book straight away, snooze for a week, or be marked done.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import { rupees } from '../healthcare/data';
import { CAT_VACCINES, DOG_VACCINES, type PetVaccine } from './data';

const DAY = 'day';
const DUE_PUSH = 'due-push';

function vaccineRow(vaccine: PetVaccine) {
  return {
    id: vaccine.id,
    title: vaccine.name,
    description: `${vaccine.detail} · ${rupees(vaccine.price)}`,
    set: { vaccine: vaccine.name, vaccinePrice: String(vaccine.price) },
  };
}

/** Status shown on the schedule card: the first vaccine is overdue, the next two due. */
function statusOf(index: number): { status: string; flag?: 'high' } {
  if (index === 0) {
    return { status: 'Overdue', flag: 'high' };
  }
  return { status: index < 3 ? 'Due this month' : 'Up to date' };
}

/** The schedule PDF and the "which vaccine" list for one species. */
function speciesNodes(key: string, label: string, vaccines: readonly PetVaccine[]): AuthorNode[] {
  return [
    {
      id: `${key}-card`,
      type: 'document',
      data: {
        document: {
          fileName: 'PawPal_Vaccination_Card.pdf',
          fileType: 'PDF',
          pages: 1,
          sizeKb: 142,
          preview: {
            title: 'Vaccination card',
            subtitle: `PawPal Pet Clinic · ${label}`,
            sections: [
              {
                kind: 'fields',
                fields: [
                  { label: 'Pet', value: '{{petName}}' },
                  { label: 'Born', value: '{{petDob}}' },
                  { label: 'Parent', value: '{{user.fullName}}' },
                  { label: 'Vet', value: 'Dr. Sravani Reddy' },
                ],
              },
              {
                kind: 'table',
                heading: 'Vaccines',
                columns: ['Vaccine', 'Schedule', 'Status'],
                rows: vaccines.map((v, i) => {
                  const { status, flag } = statusOf(i);
                  return { id: v.id, cells: [v.name, v.detail, status], flag };
                }),
              },
            ],
            footer: 'Due dates are worked out from the date of birth and past doses.',
          },
        },
        caption: "Here is {{petName}}'s vaccination card. Overdue doses are highlighted.",
      },
      next: `${key}-due`,
    },
    {
      id: `${key}-due`,
      type: 'list',
      data: {
        text: 'Which vaccine would you like to book for {{petName}}?',
        footer: 'Includes a quick health check before the shot',
        button: 'Choose vaccine',
        sections: [{ id: 'vaccines', title: `${label} vaccines`, rows: vaccines.map(vaccineRow) }],
      },
      next: Object.fromEntries(vaccines.map((v) => [v.id, DAY])),
    },
  ];
}

export const vaccination = defineWorkflow({
  key: 'vaccination',
  name: 'Vaccination reminders',
  description: "Your pet's schedule, bookings and dose reminders",
  keywords: ['vaccine', 'vaccination', 'booster', 'rabies', 'shots', 'deworming'],
  nodes: [
    {
      id: 'species',
      type: 'buttons',
      data: {
        header: 'Vaccinations',
        text: 'Hi {{user.firstName}}, let us keep your pet protected. Is it a dog or a cat?',
        buttons: [
          { id: 'dog', title: 'Dog', set: { species: 'dog' } },
          { id: 'cat', title: 'Cat', set: { species: 'cat' } },
        ],
      },
      next: { dog: 'pet-name', cat: 'pet-name' },
    },
    {
      id: 'pet-name',
      type: 'input',
      data: { prompt: "Your {{species}}'s name?", var: 'petName', kind: 'text' },
      next: 'pet-dob',
    },
    {
      id: 'pet-dob',
      type: 'input',
      data: {
        prompt: "{{petName}}'s date of birth (DD/MM/YYYY)? A rough date is fine.",
        var: 'petDob',
        kind: 'date',
        past: true,
        error: 'Please type a date in the past as DD/MM/YYYY, e.g. 15/03/2022.',
      },
      next: 'route',
    },
    {
      id: 'route',
      type: 'condition',
      data: { cases: [{ id: 'cat', var: 'species', op: 'eq', value: 'cat' }] },
      next: { cat: 'cat-card', else: 'dog-card' },
    },
    ...speciesNodes('dog', 'Dog', DOG_VACCINES),
    ...speciesNodes('cat', 'Cat', CAT_VACCINES),
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day suits you for the {{vaccine}} shot?',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, var: 'day' },
      },
      next: { pick: 'slot' },
    },
    {
      id: 'slot',
      type: 'list',
      data: {
        text: 'Free vaccination slots on {{dayLabel}}:',
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
          stepMin: 15,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 'review', 'other-day': DAY },
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check your booking',
        text: '*Pet:* {{petName}}\n*Vaccine:* {{vaccine}}\n*When:* {{dayLabel}} at {{slot|time}}\n*Price:* {{vaccinePrice|money}}, paid at the clinic',
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
        set: { bookingId: '$id:VX' },
        complete: true,
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Vaccination booked',
          subtitle: 'PawPal Pet Clinic, Jubilee Hills',
          fields: [
            { label: 'Pet', value: '{{petName}}' },
            { label: 'Vaccine', value: '{{vaccine}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Pay at clinic', value: '{{vaccinePrice|money}}' },
          ],
          qrData: 'pawpal://vaccine/{{bookingId}}?slot={{slot}}',
        },
        caption: 'Show this QR at reception, with the vaccination card.',
      },
      next: 'aftercare',
    },
    {
      id: 'aftercare',
      type: 'text',
      data: {
        text: 'Before the visit:\n• Make sure {{petName}} has eaten and is not unwell\n• Deworming should be done 7–10 days before\n• A little sleepiness or a sore spot for a day is normal\nCall us if there is swelling, vomiting or a fever.',
      },
      next: 'opt-in',
    },
    {
      id: 'opt-in',
      type: 'buttons',
      data: {
        text: 'Shall we remind you before every future dose and deworming for {{petName}}?',
        buttons: [
          { id: 'yes', title: 'Yes, remind me' },
          { id: 'no', title: 'No, thanks' },
        ],
      },
      next: { yes: 'yearly', no: 'no-remind' },
    },
    {
      id: 'yearly',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Booster due',
        note: 'Real use: a week before each due date.',
      },
      next: { next: 'yearly-on', later: DUE_PUSH },
    },
    {
      id: 'yearly-on',
      type: 'end',
      data: {
        text: "Done — we will remind you here whenever {{petName}}'s next dose is due.",
        showMenu: true,
      },
    },
    {
      id: 'no-remind',
      type: 'end',
      data: { text: 'Okay. You can turn reminders on any time from this menu.', showMenu: true },
    },
    {
      id: DUE_PUSH,
      type: 'image',
      data: {
        image: { icon: 'vaccine', accent: 'orange', title: 'Booster due', subtitle: '{{vaccine}}' },
        caption:
          "Hi {{user.firstName}}, {{petName}}'s {{vaccine}} booster is due next week. Staying on schedule keeps the protection going.",
      },
      next: 'due-actions',
    },
    {
      id: 'due-actions',
      type: 'buttons',
      data: {
        text: 'What would you like to do?',
        buttons: [
          { id: 'book', title: 'Book now' },
          { id: 'snooze', title: 'Remind in a week' },
          { id: 'done', title: 'Already done' },
        ],
      },
      next: { book: DAY, snooze: 'snooze', done: 'done' },
    },
    {
      id: 'snooze',
      type: 'reminder',
      data: { afterMs: 20_000, label: 'Booster due', note: 'Real use: one week later.' },
      next: { next: 'snoozed', later: DUE_PUSH },
    },
    {
      id: 'snoozed',
      type: 'end',
      data: { text: 'Sure — we will remind you again in a week.', showMenu: true },
    },
    {
      id: 'done',
      type: 'end',
      data: { text: "Great, we have updated {{petName}}'s card. Thank you!", showMenu: true },
    },
    {
      id: 'not-booked',
      type: 'end',
      data: {
        text: 'No booking was made. You can start again from the menu at any time.',
        showMenu: true,
      },
    },
  ],
});
