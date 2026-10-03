/**
 * Workspace tour: centre (grouped by city) → centre card → day → slot → just me or a team →
 * review → QR visitor pass → map pin, calendar and a virtual-tour link → a "see you today"
 * push that can confirm, reschedule or cancel.
 */
import { defineWorkflow } from '../../author';
import { BRAND, CENTRES, COMMUNITY, centreSections } from './data';
import { centrePins } from './pins';

const DAY = 'day';

export const tour = defineWorkflow({
  key: 'tour',
  name: 'Book a tour',
  description: 'See a centre with our community team, free',
  keywords: ['tour', 'visit', 'see the space', 'site visit', 'walkthrough'],
  nodes: [
    {
      id: 'centre',
      type: 'list',
      data: {
        header: 'Book a free tour',
        set: { visitors: '' },
        text: 'Hi {{user.firstName}}! Tours take 20 minutes and end with a free coffee. Which centre would you like to see?',
        footer: 'Tours Mon–Sat, 10 am – 7 pm',
        button: 'Choose centre',
        sections: centreSections(),
      },
      next: Object.fromEntries(CENTRES.map((c) => [c.id, 'card'])),
    },
    {
      id: 'card',
      type: 'image',
      data: {
        image: { icon: 'business', accent: 'amber', title: '{{centre}}', subtitle: '{{area}}' },
        caption:
          '*{{centre}}* — {{highlights}}. Hot desks, dedicated desks, cabins and meeting rooms.',
      },
      next: DAY,
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day would you like to visit {{centre}}?',
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
        text: 'Tour times on {{dayLabel}}:',
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
      next: { pick: 'has-party', 'other-day': DAY },
    },
    {
      id: 'has-party',
      type: 'condition',
      data: {
        note: 'A changed or rescheduled time keeps the party size already given.',
        cases: [{ id: 'known', var: 'visitors', op: 'notEmpty' }],
      },
      next: { known: 'review', else: 'party' },
    },
    {
      id: 'party',
      type: 'buttons',
      data: {
        text: 'Who is coming along?',
        buttons: [
          { id: 'solo', title: 'Just me', set: { visitors: '1' } },
          { id: 'team', title: 'With my team' },
        ],
      },
      next: { solo: 'review', team: 'team-size' },
    },
    {
      id: 'team-size',
      type: 'input',
      data: {
        prompt: 'How many people in total, including you? We will arrange passes for everyone.',
        var: 'visitors',
        kind: 'number',
        error: 'Please type a number, e.g. 3.',
      },
      next: 'review',
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check your tour',
        text: '*Visitor:* {{user.fullName}}\n*People:* {{visitors}}\n*Centre:* {{centre}}\n*When:* {{dayLabel}} at {{slot|time}}\n*Host:* {{host}}',
        set: { host: COMMUNITY.name },
        buttons: [
          { id: 'confirm', title: 'Confirm tour' },
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
        set: { tourId: '$id:TR' },
        ticket: {
          ticketId: '{{tourId}}',
          title: 'Visitor pass',
          subtitle: '{{centre}} · free tour',
          fields: [
            { label: 'Visitor', value: '{{user.fullName}}' },
            { label: 'People', value: '{{visitors}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Host', value: '{{host}}' },
            { label: 'Wi-Fi', value: 'Loftline-Guest' },
          ],
          qrData: 'https://loftline.example/v/{{tourId}}',
        },
        caption:
          'Scan this QR at the front desk — it opens the gate and lets {{host}} know you are here.',
      },
      next: 'pin-route',
    },
    ...centrePins(
      'pin',
      'Visitor parking in the basement. Take the lift to reception and show your pass.',
      'calendar',
    ),
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Add the tour to your calendar. Cannot wait? Take the 3D tour now.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: 'Tour — {{centre}}',
              start: '{{slot}}',
              durationMin: 30,
              location: '{{centre}}',
            },
          },
          { kind: 'url', title: '3D tour', url: BRAND.tour3d },
        ],
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: { afterMs: 20_000, label: 'Your tour is today', note: 'Real use: the morning of.' },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: { text: 'See you soon, {{user.firstName}}!', showMenu: true },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Tour today',
        text: 'Hi {{user.firstName}}, {{host}} will meet you at {{centre}} at {{slot|time}} today. Coffee is on us.',
        buttons: [
          { id: 'coming', title: 'On my way' },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'cancel', title: 'Cancel tour' },
        ],
      },
      next: { coming: 'r-ok', reschedule: DAY, cancel: 'r-cancel' },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: { text: 'Lovely — {{host}} will be at reception.', showMenu: true },
    },
    {
      id: 'r-cancel',
      type: 'end',
      data: {
        text: 'Tour {{tourId}} is cancelled. Type *tour* whenever you want to book again.',
        showMenu: true,
      },
    },
    {
      id: 'not-booked',
      type: 'end',
      data: { text: 'No tour was booked. Start again from the menu at any time.', showMenu: true },
    },
  ],
});
