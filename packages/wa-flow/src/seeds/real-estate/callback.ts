/**
 * Agent callback: topic → now (straight to the relationship manager), in an hour, or a
 * chosen day and slot → phone check → callback QR and the RM's card, with a heads-up push
 * just before the call.
 */
import { defineWorkflow } from '../../author';
import { RM } from './data';

const WHEN = 'when';
const PHONE = 'phone-check';

export const callback = defineWorkflow({
  key: 'callback',
  name: 'Request a callback',
  description: 'A relationship manager calls you when it suits you',
  keywords: ['callback', 'call back', 'call me', 'agent', 'talk to someone', 'sell my flat'],
  nodes: [
    {
      id: 'topic',
      type: 'list',
      data: {
        text: 'Sure, {{user.firstName}}. What would you like to talk about?',
        button: 'Topics',
        sections: [
          {
            id: 'topics',
            title: 'Topic',
            rows: [
              { id: 'buy', title: 'Buying a home', set: { topic: 'Buying a home' } },
              { id: 'rent', title: 'Renting a home', set: { topic: 'Renting a home' } },
              { id: 'sell', title: 'Selling my property', set: { topic: 'Selling my property' } },
              { id: 'loan', title: 'Home loan', set: { topic: 'Home loan' } },
              { id: 'visit', title: 'After my site visit', set: { topic: 'Site visit follow-up' } },
            ],
          },
        ],
      },
      next: { buy: WHEN, rent: WHEN, sell: WHEN, loan: WHEN, visit: WHEN },
    },
    {
      id: WHEN,
      type: 'buttons',
      data: {
        text: 'When should we call?',
        footer: 'Calls 9 am – 8 pm, all days',
        buttons: [
          { id: 'now', title: 'Chat now' },
          { id: 'hour', title: 'Within an hour', set: { callWhen: 'Within the next hour' } },
          { id: 'pick', title: 'Pick a time' },
        ],
      },
      next: { now: 'rm', hour: PHONE, pick: 'day' },
    },
    {
      id: 'day',
      type: 'list',
      data: {
        text: 'Which day?',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 5, var: 'day' },
      },
      next: { pick: 'slot' },
    },
    {
      id: 'slot',
      type: 'list',
      data: {
        text: 'Pick a 30-minute window on {{dayLabel}}:',
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
          from: 9,
          to: 20,
          stepMin: 30,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 'slot-set', 'other-day': 'day' },
    },
    {
      id: 'slot-set',
      type: 'delay',
      data: { ms: 200, set: { callWhen: '{{dayLabel}}, {{slot|time}}' } },
      next: PHONE,
    },
    {
      id: PHONE,
      type: 'condition',
      data: { cases: [{ id: 'missing', var: 'user.phone', op: 'empty' }] },
      next: { missing: 'ask-phone', else: 'use-phone' },
    },
    {
      id: 'use-phone',
      type: 'delay',
      data: { ms: 200, set: { callPhone: '{{user.phone}}' } },
      next: 'confirmed',
    },
    {
      id: 'ask-phone',
      type: 'input',
      data: { prompt: 'Which number should we call?', var: 'callPhone', kind: 'phone' },
      next: 'confirmed',
    },
    {
      id: 'confirmed',
      type: 'ticket',
      data: {
        complete: true,
        set: { callbackId: '$id:SKC' },
        ticket: {
          ticketId: '{{callbackId}}',
          title: 'Callback scheduled',
          subtitle: 'Skyline Realty',
          fields: [
            { label: 'Name', value: '{{user.fullName}}' },
            { label: 'Phone', value: '{{callPhone}}' },
            { label: 'Topic', value: '{{topic}}' },
            { label: 'When', value: '{{callWhen}}' },
            { label: 'Caller', value: RM.name },
          ],
          qrData: 'skyline://callback/{{callbackId}}',
        },
        caption: 'Karthik will call from the number below — save it so you know it is us.',
      },
      next: 'card',
    },
    {
      id: 'card',
      type: 'contact',
      data: {
        contact: { name: RM.name, phone: RM.phone, role: RM.role, organisation: 'Skyline Realty' },
      },
      next: 'heads-up',
    },
    {
      id: 'heads-up',
      type: 'reminder',
      data: {
        afterMs: 15_000,
        label: 'Calling you shortly',
        note: 'Real use: 10 minutes before the call.',
      },
      next: { next: 'done', later: 'calling' },
    },
    { id: 'done', type: 'end', data: { text: 'Talk soon, {{user.firstName}}!', showMenu: true } },
    {
      id: 'calling',
      type: 'buttons',
      data: {
        text: 'Hi {{user.firstName}}, Karthik will call you in about 10 minutes about "{{topic}}". Still a good time?',
        buttons: [
          { id: 'ok', title: 'Yes, call me' },
          { id: 'later', title: 'Pick another time' },
          { id: 'chat', title: 'Chat instead' },
        ],
      },
      next: { ok: 'calling-ok', later: 'day', chat: 'rm' },
    },
    {
      id: 'calling-ok',
      type: 'end',
      data: { text: 'Great — keep your phone handy.', showMenu: true },
    },
    {
      id: 'rm',
      type: 'handoff',
      data: {
        agentName: RM.agentName,
        text: "Hi {{user.firstName}}, Karthik here. Happy to help — what's on your mind?",
      },
      next: 'rm-end',
    },
    { id: 'rm-end', type: 'end', data: { showMenu: true } },
  ],
});
