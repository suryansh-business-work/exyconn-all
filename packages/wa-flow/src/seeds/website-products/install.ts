/**
 * Installation booking: product → PIN code → day → slot → address → a technician visit pass
 * → add to calendar / setup videos → an "on the way" push with the technician's contact card.
 */
import { defineWorkflow } from '../../author';
import { BRAND, INSTALLS } from './data';

export const install = defineWorkflow({
  key: 'install',
  name: 'Book installation',
  description: 'A certified technician at your door, often free',
  keywords: ['install', 'installation', 'setup', 'technician', 'fitting', 'demo at home'],
  nodes: [
    {
      id: 'product',
      type: 'list',
      data: {
        header: 'Installation',
        text: 'Our certified technicians set it up, connect it to the app and show you around. What should we install?',
        button: 'Choose product',
        sections: [
          {
            id: 'installs',
            title: 'Products',
            rows: INSTALLS.map((i) => ({
              id: i.id,
              title: i.title,
              description: i.description,
              set: { installItem: i.title, installFee: i.fee },
            })),
          },
        ],
      },
      next: Object.fromEntries(INSTALLS.map((i) => [i.id, 'pin'])),
    },
    {
      id: 'pin',
      type: 'input',
      data: {
        prompt: 'Your 6-digit PIN code, so I can find a technician near you.',
        var: 'installPin',
        kind: 'pincode',
      },
      next: 'day',
    },
    {
      id: 'day',
      type: 'list',
      data: {
        text: 'Technicians are available in {{installPin}}. Installation fee: *{{installFee}}*. Which day?',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 6, skipSundays: true, var: 'visitDay' },
      },
      next: { pick: 'slot' },
    },
    {
      id: 'slot',
      type: 'list',
      data: {
        text: 'Visit windows on {{visitDayLabel}}:',
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
          dayVar: 'visitDay',
          from: 9,
          to: 19,
          stepMin: 60,
          take: 8,
          var: 'visitSlot',
        },
      },
      next: { pick: 'address', 'other-day': 'day' },
    },
    {
      id: 'address',
      type: 'input',
      data: {
        prompt: 'Last step — the full address with flat or house number and a landmark.',
        var: 'visitAddress',
        kind: 'text',
        error: 'Please add a little more so the technician can find you.',
      },
      next: 'pass',
    },
    {
      id: 'pass',
      type: 'ticket',
      data: {
        complete: true,
        set: { visitId: '$id:INS', techName: '$pick:Manoj Shetty|Farhan Ali|Deepak Rao' },
        ticket: {
          ticketId: '{{visitId}}',
          title: 'Installation visit',
          subtitle: '{{installItem}}',
          fields: [
            { label: 'Date', value: '{{visitDayLabel}}' },
            { label: 'Arrival window', value: '{{visitSlot|time}} – 1 hour' },
            { label: 'Technician', value: '{{techName}}' },
            { label: 'Fee', value: '{{installFee}}' },
            { label: 'Address', value: '{{visitAddress}}' },
          ],
          qrData: 'https://lumiohome.example/v/{{visitId}}',
        },
        caption: 'Booked! {{techName}} will scan this QR on arrival to activate your warranty.',
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Add the visit to your calendar, and keep your Wi-Fi password handy.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: 'Lumio installation — {{installItem}}',
              start: '{{visitSlot}}',
              durationMin: 60,
              location: '{{visitAddress}}',
            },
          },
          { kind: 'url', title: 'Setup videos', url: BRAND.setup },
        ],
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Technician on the way',
        note: 'Real use: when the technician leaves.',
      },
      next: { next: 'booked-end', later: 'on-way' },
    },
    {
      id: 'booked-end',
      type: 'end',
      data: { text: 'See you then! Anything else?', showMenu: true },
    },
    {
      id: 'on-way',
      type: 'text',
      data: { text: '{{techName}} is on the way and will reach you in about 30 minutes.' },
      next: 'tech-card',
    },
    {
      id: 'tech-card',
      type: 'contact',
      data: {
        contact: {
          name: '{{techName}}',
          phone: '+91 98861 22045',
          role: 'Certified installer',
          organisation: 'Lumio Home Services',
        },
      },
      next: 'on-way-end',
    },
    { id: 'on-way-end', type: 'end', data: { showMenu: false } },
  ],
});
