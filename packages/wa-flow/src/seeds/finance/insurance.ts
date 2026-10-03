/**
 * Insurance consultation: type → who is covered → age (a medical check note above 45) →
 * a plan carousel per type → a free advisor call: day → slot → review → QR ticket, calendar
 * and a reminder push with the video link.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import type { Product } from '../../schema';
import { FIRM, INSURANCE_TYPES, type InsurancePlan, type InsuranceType } from './data';

const WHO = 'who';
const ROUTE = 'route';
const DAY = 'day';
const [FIRST_TYPE, ...OTHER_TYPES] = INSURANCE_TYPES;

function planCard(type: InsuranceType, plan: InsurancePlan): Product {
  return {
    id: plan.id,
    title: plan.title,
    subtitle: `${plan.insurer} · ${plan.cover} · premium a year from`,
    price: plan.premium,
    badge: plan.badge,
    image: { icon: type.icon, accent: 'green', title: plan.title, subtitle: plan.insurer },
    buttonTitle: 'Discuss this plan',
    set: {
      planName: `${plan.title} (${plan.insurer})`,
      premium: String(plan.premium),
      cover: plan.cover,
    },
  };
}

function plansCarousel(type: InsuranceType): AuthorNode {
  return {
    id: `plans-${type.key}`,
    type: 'carousel',
    data: {
      text: 'Plans that fit, {{user.firstName}}. Premiums are indicative for age {{age}}; your advisor confirms the exact quote.',
      cards: type.plans.map((plan) => planCard(type, plan)),
    },
    next: Object.fromEntries(type.plans.map((p) => [p.id, DAY])),
  };
}

export const insurance = defineWorkflow({
  key: 'insurance',
  name: 'Insurance consultation',
  description: 'Health, life, motor and home cover with a free advisor',
  keywords: [
    'insurance',
    'health insurance',
    'term insurance',
    'policy',
    'cover',
    'motor insurance',
  ],
  nodes: [
    {
      id: 'type',
      type: 'list',
      data: {
        header: 'Insurance',
        text: 'Hi {{user.firstName}}, what would you like to protect? We compare plans from leading insurers and help with claims for free.',
        button: 'Choose cover',
        sections: [
          {
            id: 'types',
            title: 'Insurance',
            rows: INSURANCE_TYPES.map((t) => ({
              id: t.key,
              title: t.name,
              description: t.description,
              set: { insType: t.name, insKey: t.key },
            })),
          },
        ],
      },
      next: Object.fromEntries(INSURANCE_TYPES.map((t) => [t.key, WHO])),
    },
    {
      id: WHO,
      type: 'buttons',
      data: {
        text: 'Who should the {{insType}} cover?',
        buttons: [
          { id: 'me', title: 'Just me', set: { insured: 'Self' } },
          { id: 'family', title: 'My family', set: { insured: 'Self, spouse and children' } },
          { id: 'parents', title: 'My parents', set: { insured: 'Parents' } },
        ],
      },
      next: { me: 'age', family: 'age', parents: 'age' },
    },
    {
      id: 'age',
      type: 'input',
      data: {
        prompt: 'Age of the eldest person to be covered?',
        var: 'age',
        kind: 'number',
        error: 'Please type the age as a number, e.g. 42.',
      },
      next: 'age-check',
    },
    {
      id: 'age-check',
      type: 'condition',
      data: { cases: [{ id: 'senior', var: 'age', op: 'gt', value: '45' }] },
      next: { senior: 'medical', else: ROUTE },
    },
    {
      id: 'medical',
      type: 'notice',
      data: {
        text: 'Above 45, most insurers ask for a free medical check-up. We arrange it at home — no out-of-pocket cost.',
      },
      next: ROUTE,
    },
    {
      id: ROUTE,
      type: 'condition',
      data: {
        cases: OTHER_TYPES.map((t) => ({
          id: t.key,
          var: 'insKey',
          op: 'eq' as const,
          value: t.key,
        })),
      },
      next: {
        ...Object.fromEntries(OTHER_TYPES.map((t) => [t.key, `plans-${t.key}`])),
        else: `plans-${FIRST_TYPE.key}`,
      },
    },
    ...INSURANCE_TYPES.map(plansCarousel),
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Book a free 20-minute call with an advisor about *{{planName}}*. Which day?',
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
        text: 'Free advisor slots on {{dayLabel}} (IST):',
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
        header: 'Check your booking',
        text: '*Cover:* {{insType}} for {{insured}}\n*Eldest age:* {{age}}\n*Plan:* {{planName}}\n*Cover amount:* {{cover}}\n*Premium from:* {{premium|money}} a year\n*Call:* {{dayLabel}} at {{slot|time}}',
        footer: 'The consultation is free',
        buttons: [
          { id: 'confirm', title: 'Confirm call' },
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
        set: { callId: '$id:INS' },
        complete: true,
        ticket: {
          ticketId: '{{callId}}',
          title: 'Advisor call booked',
          subtitle: 'Kosh Finserv · Insurance desk',
          fields: [
            { label: 'Name', value: '{{user.fullName}}' },
            { label: 'Cover', value: '{{insType}}' },
            { label: 'Plan', value: '{{planName}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Advisor', value: 'Fatima Sheikh' },
          ],
          qrData: 'kosh://insurance/{{callId}}?slot={{slot}}',
        },
        caption: 'Keep your existing policies handy so we can check for gaps or overlaps.',
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Add the call to your calendar.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: 'Insurance call — Kosh Finserv',
              start: '{{slot}}',
              durationMin: 20,
              location: FIRM.video,
            },
          },
          { kind: 'call', title: 'Call us', phone: FIRM.phone },
        ],
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: { afterMs: 20_000, label: 'Advisor call soon', note: 'Real use: 30 minutes before.' },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'Booked, {{user.firstName}}. We will send the call link before it starts.',
        showMenu: true,
      },
    },
    {
      id: 'r-msg',
      type: 'cta',
      data: {
        header: 'Your call starts soon',
        text: 'Your insurance call is at {{slot|time}}. Join on video, or we will call you on your registered number.',
        actions: [{ kind: 'url', title: 'Join video call', url: FIRM.video }],
      },
      next: 'r-end',
    },
    { id: 'r-end', type: 'end', data: { showMenu: true } },
    {
      id: 'not-booked',
      type: 'end',
      data: {
        text: 'No call was booked. You can start again from the menu at any time.',
        showMenu: true,
      },
    },
  ],
});
