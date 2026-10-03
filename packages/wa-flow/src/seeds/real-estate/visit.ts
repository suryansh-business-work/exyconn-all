/**
 * Site visit: the home picked in "Find a home" (or a project list) → day → slot → drive
 * yourself or a free pickup (address) → visitor → visit pass QR, the relationship manager's
 * card, the experience centre pin, calendar → a reminder push that confirms, reschedules or
 * cancels.
 */
import { defineWorkflow } from '../../author';
import { BUY_BANDS, OFFICE, RM, listingSet } from './data';

const DAY = 'day';
const WHO = 'who';

export const visit = defineWorkflow({
  key: 'visit',
  name: 'Book a site visit',
  description: 'Free pickup and drop, with a relationship manager',
  keywords: ['site visit', 'visit', 'see the flat', 'show flat', 'sample flat', 'pickup'],
  nodes: [
    {
      id: 'has-listing',
      type: 'condition',
      data: {
        note: 'Reuse the home picked in "Find a home"; otherwise choose a project.',
        cases: [{ id: 'none', var: 'listing', op: 'empty' }],
      },
      next: { none: 'project', else: 'intro' },
    },
    {
      id: 'project',
      type: 'list',
      data: {
        text: 'Which project would you like to visit, {{user.firstName}}?',
        button: 'Projects',
        sections: BUY_BANDS.map((b) => ({
          id: b.id,
          title: b.title,
          rows: b.listings.map((l) => ({
            id: l.id,
            title: l.title,
            description: `${l.config} · ${l.area} · ${l.priceLabel}`,
            set: listingSet(l),
          })),
        })),
      },
      next: Object.fromEntries(BUY_BANDS.flatMap((b) => b.listings.map((l) => [l.id, DAY]))),
    },
    {
      id: 'intro',
      type: 'text',
      data: {
        text: 'Let us plan your visit to *{{listing}}, {{listingArea}}*. The sample flat is open every day.',
      },
      next: DAY,
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day suits you?',
        footer: 'Weekends fill up fast',
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
        text: 'Visit slots at {{listing}} on {{dayLabel}} (about 1 hour each):',
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
          stepMin: 60,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 'transport', 'other-day': DAY },
    },
    {
      id: 'transport',
      type: 'buttons',
      data: {
        text: 'How will you get there? We offer a free pickup and drop within 15 km.',
        buttons: [
          { id: 'self', title: 'I’ll drive', set: { transport: 'Self drive' } },
          { id: 'pickup', title: 'Free pickup', set: { transport: 'Free pickup' } },
        ],
      },
      next: { self: WHO, pickup: 'pickup-pin' },
    },
    {
      id: 'pickup-pin',
      type: 'input',
      data: {
        prompt: 'Your 6-digit PIN code, so we can check pickup coverage?',
        var: 'pincode',
        kind: 'pincode',
      },
      next: 'pickup-address',
    },
    {
      id: 'pickup-address',
      type: 'input',
      data: {
        prompt: 'Great, we cover {{pincode}}. The pickup address — flat, building and a landmark?',
        var: 'pickupAddress',
        kind: 'text',
        error: 'Please type a little more of the address so our driver can find you.',
      },
      next: WHO,
    },
    {
      id: WHO,
      type: 'buttons',
      data: {
        text: 'Who is visiting?',
        buttons: [
          {
            id: 'self',
            title: 'Me',
            set: { visitor: '{{user.fullName}}', visitorPhone: '{{user.phone}}' },
          },
          { id: 'other', title: 'Someone else' },
        ],
      },
      next: { self: 'own-phone', other: 'v-name' },
    },
    {
      id: 'own-phone',
      type: 'condition',
      data: { cases: [{ id: 'missing', var: 'visitorPhone', op: 'empty' }] },
      next: { missing: 'ask-phone', else: 'review' },
    },
    {
      id: 'ask-phone',
      type: 'input',
      data: {
        prompt: 'Which mobile number should the relationship manager call?',
        var: 'visitorPhone',
        kind: 'phone',
      },
      next: 'review',
    },
    {
      id: 'v-name',
      type: 'input',
      data: { prompt: "Visitor's full name?", var: 'visitor', kind: 'name' },
      next: 'v-phone',
    },
    {
      id: 'v-phone',
      type: 'input',
      data: { prompt: "{{visitor}}'s mobile number?", var: 'visitorPhone', kind: 'phone' },
      next: 'review',
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check your visit',
        text: '*Project:* {{listing}}, {{listingArea}}\n*When:* {{dayLabel}} at {{slot|time}}\n*Visitor:* {{visitor}} ({{visitorPhone}})\n*Getting there:* {{transport}}',
        buttons: [
          { id: 'confirm', title: 'Confirm visit' },
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
        set: { visitId: '$id:SKV' },
        ticket: {
          ticketId: '{{visitId}}',
          title: 'Site visit confirmed',
          subtitle: '{{listing}}, {{listingArea}}',
          fields: [
            { label: 'Visitor', value: '{{visitor}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Home', value: '{{listingConfig}} · {{listingPrice}}' },
            { label: 'Getting there', value: '{{transport}}' },
            { label: 'Your RM', value: RM.name },
          ],
          qrData: 'skyline://visit/{{visitId}}?slot={{slot}}',
        },
        caption:
          'Show this QR at the site gate. Visit offers (up to ₹2 lakh off) are valid only on the day of the visit.',
      },
      next: 'rm-card',
    },
    {
      id: 'rm-card',
      type: 'contact',
      data: {
        contact: { name: RM.name, phone: RM.phone, role: RM.role, organisation: 'Skyline Realty' },
      },
      next: 'centre',
    },
    {
      id: 'centre',
      type: 'location',
      data: {
        location: { name: OFFICE.name, address: OFFICE.address, lat: OFFICE.lat, lng: OFFICE.lng },
        caption:
          'We start at our experience centre — scale models, a VR walkthrough and coffee — then drive to the site together.',
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Add the visit to your calendar.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: 'Site visit — {{listing}}',
              start: '{{slot}}',
              durationMin: 90,
              location: OFFICE.address,
            },
          },
          { kind: 'call', title: 'Call Karthik', phone: RM.phone },
        ],
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Site visit reminder',
        note: 'Real use: the evening before.',
      },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'See you on {{dayLabel}}, {{user.firstName}}. Karthik will call you the evening before.',
        showMenu: true,
      },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Visit tomorrow',
        text: 'Hi {{user.firstName}}, your visit to *{{listing}}* is tomorrow at {{slot|time}} ({{transport}}). Visit {{visitId}}.',
        buttons: [
          { id: 'yes', title: 'See you there' },
          { id: 'move', title: 'Reschedule' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { yes: 'r-ok', move: DAY, cancel: 'r-cancel' },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: { text: 'Perfect. Karthik will be waiting for you.', showMenu: true },
    },
    {
      id: 'r-cancel',
      type: 'end',
      data: {
        text: 'Cancelled. Type *site visit* whenever you would like to come.',
        showMenu: true,
      },
    },
    {
      id: 'not-booked',
      type: 'end',
      data: {
        text: 'No visit was booked. You can start again from the menu at any time.',
        showMenu: true,
      },
    },
  ],
});
