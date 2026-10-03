/**
 * Demo booking: product → team size → work email (the signed-in one or another) → company →
 * day → slot → review → QR invite, calendar + join link, the consultant's card and a
 * reminder push that can join, reschedule or cancel.
 */
import { defineWorkflow } from '../../author';
import { COMPANY, PRODUCTS, SOLUTIONS, type SaasProduct } from './data';

const DAY = 'day';

const productRow = (product: SaasProduct) => ({
  id: product.key,
  title: product.name,
  description: product.description,
  set: { product: product.name },
});

export const demo = defineWorkflow({
  key: 'demo',
  name: 'Book a demo',
  description: 'A 30-minute live demo with a product expert',
  keywords: ['demo', 'book demo', 'product demo', 'walkthrough', 'see the product'],
  nodes: [
    {
      id: 'product',
      type: 'list',
      data: {
        header: 'Book a live demo',
        text: 'Great to meet you, {{user.firstName}}! Which product would you like to see? Every demo is tailored to your team and runs for 30 minutes.',
        footer: 'Demos Mon–Sat, 10 am – 7 pm IST',
        button: 'Choose product',
        sections: [{ id: 'products', title: 'Products', rows: PRODUCTS.map(productRow) }],
      },
      next: Object.fromEntries(PRODUCTS.map((p) => [p.key, 'size'])),
    },
    {
      id: 'size',
      type: 'buttons',
      data: {
        text: 'How big is the team that will use {{product}}?',
        buttons: [
          { id: 'small', title: '1–20 people', set: { teamSize: '1–20' } },
          { id: 'mid', title: '21–200 people', set: { teamSize: '21–200' } },
          { id: 'large', title: '200+ people', set: { teamSize: '200+' } },
        ],
      },
      next: { small: 'email-choice', mid: 'email-choice', large: 'email-choice' },
    },
    {
      id: 'email-choice',
      type: 'buttons',
      data: {
        text: 'Where should we send the calendar invite?\n{{user.email}}',
        buttons: [
          { id: 'mine', title: 'Use this email', set: { workEmail: '{{user.email}}' } },
          { id: 'other', title: 'Another email' },
        ],
      },
      next: { mine: 'company', other: 'email' },
    },
    {
      id: 'email',
      type: 'input',
      data: {
        prompt: 'Please type your work email.',
        var: 'workEmail',
        kind: 'email',
        error: 'That does not look like an email address. Try something like name@company.com.',
      },
      next: 'company',
    },
    {
      id: 'company',
      type: 'input',
      data: {
        prompt: 'And your company name?',
        var: 'company',
        kind: 'text',
        error: 'Please type your company name — at least 2 characters.',
      },
      next: DAY,
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Thanks! Which day works for a {{product}} demo for {{company}}?',
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
        text: 'Open slots on {{dayLabel}} (IST). Demos last 30 minutes.',
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
      next: { pick: 'review', 'other-day': DAY },
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check your demo',
        text: '*Name:* {{user.fullName}}\n*Company:* {{company}} ({{teamSize}} users)\n*Email:* {{workEmail}}\n*Product:* {{product}}\n*When:* {{dayLabel}} at {{slot|time}} IST\n*With:* {{consultant}}',
        footer: 'Reschedule any time from this chat',
        set: { consultant: SOLUTIONS.name },
        buttons: [
          { id: 'confirm', title: 'Confirm demo' },
          { id: 'change', title: 'Change time' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'invite', change: DAY, cancel: 'not-booked' },
    },
    {
      id: 'invite',
      type: 'ticket',
      data: {
        complete: true,
        set: { demoId: '$id:DM' },
        ticket: {
          ticketId: '{{demoId}}',
          title: 'Demo confirmed',
          subtitle: '{{product}} · Orbitly',
          fields: [
            { label: 'Company', value: '{{company}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}} IST' },
            { label: 'Duration', value: '30 minutes' },
            { label: 'Consultant', value: '{{consultant}}' },
            { label: 'Invite sent to', value: '{{workEmail}}' },
          ],
          qrData: 'https://meet.orbitly.example/demo/{{demoId}}',
        },
        caption:
          'Scan the QR on your phone to join from anywhere. The invite is in your inbox too.',
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Add it to your calendar. Feel free to bring your team — up to 8 people can join.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: 'Orbitly demo — {{product}}',
              start: '{{slot}}',
              durationMin: 30,
              location: COMPANY.meet,
            },
          },
          { kind: 'url', title: 'Join link', url: COMPANY.meet },
        ],
      },
      next: 'consultant',
    },
    {
      id: 'consultant',
      type: 'contact',
      data: {
        contact: {
          name: SOLUTIONS.name,
          phone: SOLUTIONS.phone,
          role: SOLUTIONS.role,
          organisation: 'Orbitly',
        },
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Your demo starts soon',
        note: 'Real use: 15 minutes before the slot.',
      },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: "You're all set, {{user.firstName}}. {{consultant}} will tailor the demo to {{company}}.",
        showMenu: true,
      },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Demo reminder',
        text: 'Your {{product}} demo with {{consultant}} starts at {{slot|time}}.\nDemo {{demoId}} · 30 minutes · online.',
        buttons: [
          { id: 'join', title: 'Join now' },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'cancel', title: 'Cancel demo' },
        ],
      },
      next: { join: 'r-join', reschedule: 're-day', cancel: 'r-cancel' },
    },
    {
      id: 'r-join',
      type: 'cta',
      data: {
        text: 'Tap to join — {{consultant}} is in the room.',
        actions: [{ kind: 'url', title: 'Join demo', url: COMPANY.meet }],
      },
      next: 'r-join-end',
    },
    {
      id: 'r-join-end',
      type: 'end',
      data: { text: 'Enjoy the demo, {{user.firstName}}!', showMenu: true },
    },
    {
      id: 're-day',
      type: 'list',
      data: {
        text: 'No problem. Pick a new day for the {{product}} demo.',
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
        text: 'Open slots on {{dayLabel}} (IST):',
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
      next: { pick: 're-ticket', 'other-day': 're-day' },
    },
    {
      id: 're-ticket',
      type: 'ticket',
      data: {
        ticket: {
          ticketId: '{{demoId}}',
          title: 'Demo rescheduled',
          subtitle: '{{product}} · Orbitly',
          fields: [
            { label: 'Company', value: '{{company}}' },
            { label: 'New date', value: '{{dayLabel}}' },
            { label: 'New time', value: '{{slot|time}} IST' },
            { label: 'Consultant', value: '{{consultant}}' },
          ],
          qrData: 'https://meet.orbitly.example/demo/{{demoId}}',
        },
        caption: 'Updated invite sent to {{workEmail}}.',
      },
      next: 're-done',
    },
    {
      id: 're-done',
      type: 'end',
      data: { text: 'Done. See you then!', showMenu: true },
    },
    {
      id: 'r-cancel',
      type: 'end',
      data: {
        text: 'Demo {{demoId}} is cancelled. Type *demo* whenever you want to book again.',
        showMenu: true,
      },
    },
    {
      id: 'not-booked',
      type: 'end',
      data: {
        text: 'No demo was booked. You can start again from the menu at any time.',
        showMenu: true,
      },
    },
  ],
});
